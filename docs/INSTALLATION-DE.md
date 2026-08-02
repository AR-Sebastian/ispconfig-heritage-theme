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

## Optionales globales Login-Theme

Die Kontoauswahl ändert nur die authentifizierte Oberfläche. ISPConfig rendert
das anonyme Login über `$conf['theme']`; der Werkswert ist `default`. Behalte
diesen Standard bei, solange der Betreiber kein global gebrandetes Login
ausdrücklich freigibt. Für den Opt-in muss
`/usr/local/ispconfig/interface/lib/config.inc.php` gesichert, der vorhandene
Wert von `$conf['theme']` auf `heritage` gesetzt, der Interface-Webdienst neu
geladen und eine vollständig neue anonyme Sitzung gestartet werden. Diese
Konfiguration gehört ISPConfig, muss nach ISPConfig-Updates möglicherweise
erneut geprüft werden und wird vom HERITAGE-Installer absichtlich nie geändert.

Die Option „angemeldet bleiben“ erscheint nur, wenn ISPConfig sowohl ein
positives Sitzungs-Timeout als auch endlose Sitzungen erlaubt. HERITAGE lockert
diese serverseitigen Sicherheitsvorgaben nicht.

## Geprüftes Release-Archiv

Lade für Linux bevorzugt das TAR.GZ-Archiv und die Prüfsummendatei direkt aus
dem Release herunter:

```bash
curl -fLO https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/download/v1.0.34/ispconfig-heritage-theme-1.0.34.tar.gz
curl -fLO https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/download/v1.0.34/SHA256SUMS.txt
sha256sum -c --ignore-missing SHA256SUMS.txt
sudo tar -xzf ispconfig-heritage-theme-1.0.34.tar.gz -C /usr/local/ispconfig/interface/web/themes/
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
