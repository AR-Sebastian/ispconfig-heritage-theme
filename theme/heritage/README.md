# ISPConfig HERITAGE 1.0.14

## Deutsch

HERITAGE verbindet die vertraute ISPConfig-Bedienlogik mit einer ruhigen,
präzisen Premium-Oberfläche. Die primären Module liegen auf großen Bildschirmen
in einer horizontalen Leiste; die berechtigungsabhängige Navigation des aktiven
Moduls bleibt als klare Seitenleiste erhalten. Auf Tablets und Smartphones wird
dieselbe Informationsarchitektur als zugängliche Navigation dargestellt.

### Status und Kompatibilität

- Version: `1.0.14`
- Status: stabil
- ISPConfig-Basis: `3.3.1p1`
- geprüft mit Administrator-, Reseller-, Kunden- und Mailuser-Rollen
- geprüft auf Ubuntu 22.04/24.04 und Debian 12/13 mit Apache und Nginx
- notwendiger Rückfall: Das ISPConfig-Theme `default` bleibt installiert

### Installation

1. Die Prüfsumme des heruntergeladenen Archivs mit der veröffentlichten
   `SHA256SUMS.json` vergleichen.
2. Das Archiv so entpacken, dass anschließend dieses Verzeichnis existiert:
   `/usr/local/ispconfig/interface/web/themes/heritage/`
3. Eigentümer und Rechte entsprechend der vorhandenen ISPConfig-Themes setzen.
4. HERITAGE zuerst für einen einzelnen Testbenutzer auswählen, neu anmelden und
   anschließend weitere Rollen freigeben.

Der mitgelieferte Installer prüft Archivpfade, Prüfsumme und Paketmetadaten,
erstellt beim Upgrade ein Backup und ersetzt das Theme atomar.

### Grenzen

HERITAGE verändert ausschließlich die Darstellung. Rechte, Routen, APIs,
Datenbankänderungen und die serverseitige Bereitstellung bleiben vollständig
bei ISPConfig. Nicht mehr unterstützte Altbereiche werden nicht neu
implementiert. NEXT oder LIQUID werden nicht benötigt.

### Rückkehr zum Standardtheme

Das betroffene Benutzerkonto auf `default` zurückstellen und neu anmelden. Das
HERITAGE-Verzeichnis erst entfernen, nachdem die Standardsitzung geprüft wurde.

## English

HERITAGE combines ISPConfig's familiar operating model with a calm,
precision-focused premium interface. Primary modules use a horizontal bar on
wide screens while the permission-aware navigation of the active module remains
available as a clear sidebar. Tablets and phones receive the same information
architecture through an accessible responsive navigation.

### Status and compatibility

- Version: `1.0.14`
- Stage: stable
- ISPConfig baseline: `3.3.1p1`
- validated with administrator, reseller, client and mail-user roles
- validated on Ubuntu 22.04/24.04 and Debian 12/13 with Apache and Nginx
- required fallback: keep ISPConfig's `default` theme installed

### Installation

1. Compare the downloaded archive with the published `SHA256SUMS.json`.
2. Extract it so this directory exists afterwards:
   `/usr/local/ispconfig/interface/web/themes/heritage/`
3. Apply the same ownership and permissions as the existing ISPConfig themes.
4. Select HERITAGE for one test user first, sign in again, and then enable it
   for additional roles.

The supplied installer verifies archive paths, checksum and package metadata,
creates an upgrade backup and replaces the theme atomically.

### Boundaries

HERITAGE changes presentation only. Permissions, routes, APIs, database writes
and server-side provisioning remain fully owned by ISPConfig. Retired legacy
surfaces are not reimplemented. NEXT and LIQUID are not required.

### Return to the default theme

Set the affected account back to `default` and sign in again. Remove the
HERITAGE directory only after the default session has been verified.
