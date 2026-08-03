# Problemlösung und sichere Rückkehr

## HERITAGE erscheint nicht in der Theme-Auswahl

Prüfe zuerst Installation und Version:

```bash
sudo ./scripts/manage-theme.sh status
test -f /usr/local/ispconfig/interface/web/themes/heritage/ispconfig_version
cat /usr/local/ispconfig/interface/web/themes/heritage/ispconfig_version
```

Als interner Kompatibilitätswert muss `3.3dev` erscheinen. ISPConfig 3.3.1p1
verwendet diesen Wert in `ISPC_APP_VERSION`, um auswählbare Themes zu prüfen.
Das öffentliche Release-Ziel von HERITAGE 1.0.36 bleibt ISPConfig 3.3.1p1.
Andere ISPConfig-Versionen sind nicht Bestandteil der Freigabe von HERITAGE 1.0.36.

## Nach der Auswahl bleibt das bisherige Theme sichtbar

Melde dich vollständig ab und wieder an. Prüfe anschließend die Theme-Auswahl
des betroffenen Benutzerkontos. Browser-Cache oder ein noch aktiver
ISPConfig-Sitzungszustand können die vorherige Darstellung kurzzeitig halten.

## Darstellung oder Assets fehlen

Prüfe, ob die beiden zentralen Dateien erreichbar sind:

```bash
test -f /usr/local/ispconfig/interface/web/themes/heritage/templates/main.tpl.htm
test -f /usr/local/ispconfig/interface/web/themes/heritage/assets/stylesheets/heritage-core.css
```

Installiere das anhand der SHA-256-Prüfsumme geprüfte Release erneut, wenn eine Datei fehlt. Keine Dateien
aus verschiedenen HERITAGE-Versionen übereinander kopieren.

## Sofort auf das Standardtheme zurückkehren

Stelle das betroffene Benutzerkonto in ISPConfig auf `default`. Falls HERITAGE
anschließend vom Dateisystem entfernt werden soll:

```bash
sudo ./scripts/manage-theme.sh uninstall
```

Die entfernte Installation bleibt als Sicherung erhalten. Die zuletzt durch
das Skript verwaltete Version kann wiederhergestellt werden:

```bash
sudo ./scripts/manage-theme.sh rollback
```

## Fehler melden

Eine verwertbare Meldung enthält:

- ISPConfig-Version und Betriebssystem;
- Apache oder Nginx;
- Benutzerrolle: Administrator, Reseller, Kunde oder Mailuser;
- betroffene Seite und reproduzierbare Schritte;
- Browser und Bildschirmgröße;
- Screenshot ohne Zugangsdaten, Kundendaten oder andere Geheimnisse.

Sicherheitsprobleme bitte entsprechend [SECURITY.md](../SECURITY.md) nicht als
öffentlichen Fehlerbericht einreichen.
