# Changelog

## 1.0.18 – 2026-07-31

- Prevented the content observer from reacting recursively to its own UI enhancements.
- Debounced mutation bursts and suspended observation during theme-owned DOM updates.
- Added targeted browser coverage for six representative surfaces at desktop, tablet and mobile sizes.
- All 18 runtime surfaces pass without overflow, escaped content or browser errors.

## 1.0.17 – 2026-07-31

- Application JavaScript is delivered as two reproducible ordered bundles around Chart.js.
- Login JavaScript is delivered as one dedicated reproducible bundle.
- Modular source scripts remain authoritative and independently maintainable.
- Public validation rejects stale output and enforces bundle order and budgets.

## 1.0.16 – 2026-07-31

- Application CSS is delivered as one reproducible bundle instead of 25 requests.
- Login CSS is delivered as one dedicated bundle instead of five requests.
- Modular source styles remain authoritative and independently maintainable.
- Public validation rejects stale bundle output and enforces runtime budgets.

## 1.0.15 – 2026-07-31

- All post-bootstrap login and application scripts use ordered deferred loading.
- Runtime downloads no longer serialize parser progress at the end of each shell.
- Public validation rejects new non-deferred runtime scripts.
- The deliberate early colour and language bootstrap remains synchronous.

## 1.0.14 – 2026-07-31

- Removed a private, unreferenced image from the distribution.
- Every packaged asset must now be referenced by theme source.
- Shell assets require cache generations and may not be loaded twice.
- Source payload budgets and the intentional early bootstrap are release gates.

## 1.0.13 – 2026-07-31

- One accessibility authority now covers login and authenticated surfaces.
- High contrast, forced colours, reduced motion and reduced transparency are supported.
- Active navigation and keyboard focus remain unambiguous.

## 1.0.12 – 2026-07-31

- German and English labels now have an explicit parity contract.
- Dynamic module localization is protected by the stable release gate.
- All 66 shell assets passed live HTTP delivery verification.

## 1.0.11 – 2026-07-31

- Login and authenticated shells now use the same current runtime cache key.
- Release acceptance verifies all shell assets and rejects placeholder actions.
- Stable V1 boundaries and package lifecycle remain fully enforced.

## 1.0.10 – 2026-07-31

- Dashboard, monitoring, system, billing and extensions share one module composition.
- Specialty workspaces expose consistent heroes, panels and action toolbars.
- Module panels use aligned density, headings, borders and responsive behaviour.
- Semantic landmarks improve navigation without changing module functionality.

## 1.0.9 – 2026-07-31

- Dialogs now share semantic tone, description and action-group contracts.
- Feedback states use consistent severity styling and accessible live regions.
- Temporary success and information messages expose a pause-aware lifetime indicator.
- Desktop and mobile dialog actions retain a predictable safe-first hierarchy.

## 1.0.8 – 2026-07-31

- Forms now expose one stable section, field and action hierarchy.
- Required, invalid, disabled and supporting-text states share accessible semantics.
- Primary, secondary and destructive actions retain a predictable desktop and mobile order.
- Compact and long forms use density-aware composition without changing ISPConfig submission behaviour.

## 1.0.7 – 2026-07-31

- Einheitliche Seitenköpfe, Statusbereiche und Aktionsgruppen.
- Meldungen mit stabiler Schweregrad- und Vollbreitenkomposition.
- Gemeinsame responsive Fläche für Leer-, Lade- und Fehlerzustände.
- Linksbündige mobile Titelhierarchie mit vollständigen Aktionsbreiten.

## 1.0.6 – 2026-07-31

- Einheitliches mobiles Datensatzkarten-System für alle unterstützten Module.
- Technische Identitäten übergeben ihr Bearbeitungsziel an den fachlichen Primärwert.
- Stabile Rollen für Primärwert, Status und Aktionsleiste.
- Kompakte zweispaltige Details auf mittleren Smartphone-Breiten.

## 1.0.5 – 2026-07-31

- Finished the list/table workspace with sticky headings and aligned filter rows.
- Added accessible sort-state indicators and filter names derived from columns.
- Replaced generic numbered row-action labels with meaningful localized actions.
- Preserved responsive record cards and the dedicated table pagination footer.

## 1.0.4 – 2026-07-31

- Added form-wide validation summaries for explicit ISPConfig validation errors.
- Added per-tab error counters for long multi-tab detail forms.
- Added one-step navigation to the first invalid field, including inactive tabs.
- Preserved server validation, native form submission and existing permissions.

## 1.0.3 – 2026-07-31

- Rebuilt the wide dashboard module grid as genuinely compact 1x1 destinations.
- Added a six-column wide-screen layout with four- and three-column responsive fallbacks.
- Strengthened interactive metric points, focus states and glass tooltips.
- Added calmer section separators and reduced vertical waste in module cards.

## 1.0.2 – 2026-07-31

- Kept the horizontal icon-and-label navigation down to 721 pixels.
- Added a compact tablet navigation geometry for split-screen Surface use.
- Shortened selected primary German labels without changing module identities.
- Reworked light-theme quick-create buttons into quiet, light action surfaces.

## 1.0.1 – 2026-07-31

- Reclaimed the unused contextual-navigation column on the dashboard.
- Expanded the dashboard canvas while preserving readable maximum widths.
- Improved the desktop module-widget grid from three to four compact cards per row.
- Added German and English recovery documentation and direct signed-release installation steps.
- Added a structured bilingual bug-report form and clearer public project navigation.

## 1.0.0 – 2026-07-31

- First stable standalone HERITAGE release for ISPConfig 3.3.1p1.
- Completed responsive light and dark presentation.
- Validated administrator, reseller, client and mail-user views.
- Validated eight Ubuntu/Debian and Apache/Nginx platform combinations.
- Added reproducible ZIP/TAR.GZ builds, checksums, atomic installation and rollback.
