# ISPConfig Theme HERITAGE

[![Theme validation](https://github.com/AR-Sebastian/ispconfig-heritage-theme/actions/workflows/validate.yml/badge.svg)](https://github.com/AR-Sebastian/ispconfig-heritage-theme/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/AR-Sebastian/ispconfig-heritage-theme?display_name=tag)](https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/latest)
[![ISPConfig](https://img.shields.io/badge/ISPConfig-3.3.1p1-d71920)](docs/COMPATIBILITY.md)

## Deutsch

HERITAGE ist ein eigenständiges Premium-Theme für ISPConfig 3.3.1p1. Es
verbindet eine vertraute horizontale Modulnavigation mit einer klaren
kontextbezogenen Seitenleiste, konsistenten Tabellen und Formularen sowie einem
vollständig responsiven Hell-/Dunkel-System.

### Warum HERITAGE entstanden ist

Viele Administratoren möchten eine modernere Oberfläche, ohne die bekannte
Struktur, Berechtigungslogik oder die zuverlässigen Serverabläufe von ISPConfig
zu ersetzen. HERITAGE modernisiert deshalb ausschließlich die Darstellung. Die
fachlichen Aktionen, APIs und Provisionierungsabläufe bleiben bei ISPConfig.

### Wichtigste Verbesserungen

- klare horizontale Hauptnavigation und rollenabhängige Kontextnavigation;
- einheitliche Tabellen, Filter, Formulare, Dialoge und Rückmeldungen;
- ruhige Akzentverwendung mit getrennten Erfolgs-, Warn- und Fehlerfarben;
- vollständiges helles und dunkles Farbschema;
- responsive Bedienung auf Desktop, Tablet und Smartphone;
- zugängliche Tastatur-, Fokus- und Kontrastzustände;
- eigenständiges Paket ohne NEXT-, LIQUID- oder Workbench-Abhängigkeit;
- atomare Installation mit Backup und Rollback.

### Version 1.0.23

Geprüft mit ISPConfig 3.3.1p1 für Administrator-, Reseller-, Kunden- und
Mailuser-Ansichten sowie Ubuntu 22.04/24.04 und Debian 12/13 mit Apache und
Nginx. Das originale ISPConfig-Theme `default` muss als Rückfallebene
installiert bleiben.

**[HERITAGE 1.0.23 herunterladen](https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/latest)**

### Schnellstart

```bash
git clone --branch v1.0.23 --depth 1 https://github.com/AR-Sebastian/ispconfig-heritage-theme.git
cd ispconfig-heritage-theme
sudo ./scripts/manage-theme.sh install
sudo ./scripts/manage-theme.sh status
```

Danach HERITAGE zunächst für ein Testkonto auswählen und neu anmelden. Das
Installationsskript ersetzt keine ISPConfig-Kerndateien und legt bei einem
Update automatisch eine rücksetzbare Sicherung des Themes an.

- [Installation auf Deutsch](docs/INSTALLATION-DE.md)
- [Problemlösung und Rückkehr](docs/TROUBLESHOOTING-DE.md)
- [Kompatibilität und Prüfbereich](docs/COMPATIBILITY.md)
- [Release-Abnahme 1.0.0](docs/RELEASE-GATE-1.0.0.md)
- [Änderungsprotokoll](CHANGELOG.md)
- [Lizenz](LICENSE.md)

### Lizenz

HERITAGE ist unter der PolyForm Free Trial License 1.0.0 source-available. Eine
Evaluierung ist für weniger als 32 aufeinanderfolgende Kalendertage erlaubt.
Produktive, fortgesetzte oder kommerzielle Nutzung benötigt eine separate
kommerzielle Lizenz. Von ISPConfig abgeleitete Bestandteile unterliegen den
[Hinweisen zu Drittbestandteilen](THIRD_PARTY_NOTICES.md).

Dieses unabhängige Projekt ist weder mit ISPConfig verbunden noch von
ISPConfig offiziell empfohlen.

---

## English

HERITAGE is a standalone premium theme for ISPConfig 3.3.1p1. It combines a
familiar horizontal module navigation with a clear contextual sidebar,
consistent tables and forms, and a fully responsive light/dark system.

### Why HERITAGE exists

Many administrators want a modern interface without replacing ISPConfig's
familiar structure, permission model or reliable server workflows. HERITAGE
therefore modernises presentation only. Domain actions, APIs and provisioning
remain owned by ISPConfig.

### Key improvements

- clear horizontal primary navigation and role-aware contextual navigation;
- unified tables, filters, forms, dialogs and feedback;
- restrained accent usage with distinct success, warning and error colours;
- complete light and dark colour schemes;
- responsive operation on desktop, tablet and mobile;
- accessible keyboard, focus and contrast states;
- standalone package without NEXT, LIQUID or Workbench dependencies;
- atomic installation with backup and rollback.

### Version 1.0.23

Validated with ISPConfig 3.3.1p1 for administrator, reseller, client and
mail-user views, plus Ubuntu 22.04/24.04 and Debian 12/13 with Apache and Nginx.
Keep ISPConfig's original `default` theme installed as the recovery path.

**[Download HERITAGE 1.0.23](https://github.com/AR-Sebastian/ispconfig-heritage-theme/releases/latest)**

### Quick start

```bash
git clone --branch v1.0.23 --depth 1 https://github.com/AR-Sebastian/ispconfig-heritage-theme.git
cd ispconfig-heritage-theme
sudo ./scripts/manage-theme.sh install
sudo ./scripts/manage-theme.sh status
```

Select HERITAGE for a test account and sign in again. The installer does not
replace ISPConfig core files and automatically creates a restorable theme
backup during updates.

- [Installation in English](docs/INSTALLATION-EN.md)
- [Troubleshooting and recovery](docs/TROUBLESHOOTING-EN.md)
- [Compatibility and validation scope](docs/COMPATIBILITY.md)
- [Release gate 1.0.0](docs/RELEASE-GATE-1.0.0.md)
- [Changelog](CHANGELOG.md)
- [License](LICENSE.md)

HERITAGE is source-available under the PolyForm Free Trial License 1.0.0.
Production, continued or commercial use requires a separate commercial
license. ISPConfig-derived portions remain subject to the
[third-party notices](THIRD_PARTY_NOTICES.md).

This independent project is not affiliated with or endorsed by ISPConfig.
