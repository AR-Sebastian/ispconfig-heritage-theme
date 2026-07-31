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

## Release-Archiv

Vor dem Entpacken `SHA256SUMS.txt` prüfen:

```bash
sha256sum -c SHA256SUMS.txt
```

Das gewählte Archiv muss anschließend das Verzeichnis `heritage` unter
`/usr/local/ispconfig/interface/web/themes/` erzeugen.

## Status und Rückkehr

```bash
sudo ./scripts/manage-theme.sh status
sudo ./scripts/manage-theme.sh rollback
```

Bei Problemen das Benutzerkonto auf `default` zurückstellen. Das originale
Standardtheme nicht löschen oder überschreiben.
