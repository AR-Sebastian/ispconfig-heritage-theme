#!/usr/bin/env bash
set -euo pipefail

theme_name="heritage"
product_name="ISPConfig HERITAGE"
repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="$repository_root/theme/$theme_name"
target_root="/usr/local/ispconfig/interface/web/themes"
backup_root="/var/backups/ispconfig-themes"
dry_run=0

usage() {
  cat <<EOF
Usage: sudo ./scripts/manage-theme.sh <command> [options]

Commands:
  install     Install or atomically update $product_name
  status      Show the installed and packaged versions
  rollback    Restore the newest managed backup
  uninstall   Remove the theme while keeping a restorable backup

Options:
  --target-root PATH   ISPConfig theme directory
  --backup-root PATH   Backup directory
  --dry-run            Show changes without writing them
  -h, --help           Show this help
EOF
}

command_name="${1:-}"
if [[ -z "$command_name" || "$command_name" == "-h" || "$command_name" == "--help" ]]; then
  usage
  exit 0
fi
shift

while (($#)); do
  case "$1" in
    --target-root) target_root="${2:?Missing path after --target-root}"; shift 2 ;;
    --backup-root) backup_root="${2:?Missing path after --backup-root}"; shift 2 ;;
    --dry-run) dry_run=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

target_root="${target_root%/}"
backup_root="${backup_root%/}"
target_dir="$target_root/$theme_name"

if [[ -z "$target_root" || "$target_root" == "/" || -z "$backup_root" || "$backup_root" == "/" ]]; then
  echo "Refusing unsafe target or backup root." >&2
  exit 2
fi
if [[ "$target_root" == "/usr/local/ispconfig/interface/web/themes" && "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "System installation requires root. Run this command with sudo." >&2
  exit 1
fi

run() {
  printf '→'
  printf ' %q' "$@"
  printf '\n'
  if ((dry_run == 0)); then "$@"; fi
}

theme_version() {
  local manifest="$1/theme-manifest.json"
  if [[ -f "$manifest" ]] && command -v php >/dev/null 2>&1; then
    php -r '$m=json_decode(file_get_contents($argv[1]), true); echo $m["version"] ?? "unknown";' "$manifest"
  elif [[ -f "$manifest" ]]; then
    sed -nE 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' "$manifest" | head -n1
  else
    printf 'not installed'
  fi
}

validate_payload() {
  local root="$1"
  local required=(
    "ISPC_VERSION"
    "ispconfig_version"
    "theme-manifest.json"
    "templates/main.tpl.htm"
    "templates/main_login.tpl.htm"
    "assets/stylesheets/heritage-core.css"
    "assets/javascripts/workbench-boot.js"
  )
  local file
  for file in "${required[@]}"; do
    [[ -f "$root/$file" ]] || {
      echo "Incomplete theme payload: missing $file" >&2
      exit 1
    }
  done
}

timestamp="$(date -u +%Y%m%d-%H%M%S)-$$"

case "$command_name" in
  status)
    validate_payload "$source_dir"
    printf 'Packaged %s version: %s\n' "$product_name" "$(theme_version "$source_dir")"
    printf 'Installed version: %s\n' "$(theme_version "$target_dir")"
    printf 'Target: %s\n' "$target_dir"
    ;;
  install)
    validate_payload "$source_dir"
    stage_dir="$target_root/.$theme_name.install.$timestamp"
    backup_dir="$backup_root/$theme_name-$timestamp"
    run mkdir -p "$target_root" "$backup_root"
    run rm -rf "$stage_dir"
    run mkdir -p "$stage_dir"
    run cp -a "$source_dir/." "$stage_dir/"
    if [[ -d "$target_dir" ]]; then
      run mv "$target_dir" "$backup_dir"
    fi
    run mv "$stage_dir" "$target_dir"
    if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
      run chown -R --reference="$target_root" "$target_dir"
    fi
    echo "$product_name $(theme_version "$source_dir") is ready in $target_dir"
    ;;
  rollback)
    latest_backup="$(find "$backup_root" -mindepth 1 -maxdepth 1 -type d -name "$theme_name-*" -printf '%T@ %p\n' 2>/dev/null |
      sort -nr | head -n1 | cut -d' ' -f2- || true)"
    [[ -n "$latest_backup" ]] || {
      echo "No managed $product_name backup found in $backup_root." >&2
      exit 1
    }
    replaced_dir="$backup_root/$theme_name-replaced-$timestamp"
    if [[ -d "$target_dir" ]]; then
      run mv "$target_dir" "$replaced_dir"
    fi
    run mv "$latest_backup" "$target_dir"
    echo "Restored $product_name $(theme_version "$target_dir")"
    ;;
  uninstall)
    [[ -d "$target_dir" ]] || {
      echo "$product_name is not installed in $target_dir."
      exit 0
    }
    run mkdir -p "$backup_root"
    run mv "$target_dir" "$backup_root/$theme_name-removed-$timestamp"
    echo "$product_name was removed; its files remain available for rollback."
    ;;
  *)
    echo "Unknown command: $command_name" >&2
    usage >&2
    exit 2
    ;;
esac
