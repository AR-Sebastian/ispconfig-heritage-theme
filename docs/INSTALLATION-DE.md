# Installation

## Voraussetzungen

- ISPConfig `3.3.1p1`
- PHP 8.1 oder neuer
- Shell-Zugriff mit Berechtigung für das ISPConfig-Theme-Verzeichnis
- installiertes ISPConfig-Theme `default` als Rückfallebene

## Empfohlener Weg aus dem Repository

```bash
git clone https://github.com/AR-Sebastian/ispconfig-heritage-theme.git
cd ispconfig-heritage-theme
sudo ./scripts/manage-theme.sh install
```

Danach HERITAGE zunächst für ein Testkonto auswählen und neu anmelden.

## Signiertes Release-Archiv

Lade für Linux bevorzugt das TAR.GZ-Archiv und die Prüfsummendatei direkt aus
dem Release herunter:

```bash
curl -fLO https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/download/v1.0.10/ispconfig-heritage-theme-1.0.10.tar.gz
curl -fLO https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/download/v1.0.10/SHA256SUMS.txt
sha256sum -c --ignore-missing SHA256SUMS.txt
sudo tar -xzf ispconfig-heritage-theme-1.0.10.tar.gz -C /usr/local/ispconfig/interface/web/themes/
```

Die Prüfung muss das Archiv ausdrücklich mit `OK` bestätigen. Bei einer
Warnung oder Abweichung nicht installieren. Das Archiv erzeugt
`/usr/local/ispconfig/interface/web/themes/heritage`.

## Status und Rückkehr

```bash
sudo ./scripts/manage-theme.sh status
sudo ./scripts/manage-theme.sh rollback
```

Bei Problemen das Benutzerkonto auf `default` zurückstellen. Das originale
Standardtheme nicht löschen oder überschreiben.

Ausführliche Hinweise stehen unter [Problemlösung und sichere Rückkehr](TROUBLESHOOTING-DE.md).
