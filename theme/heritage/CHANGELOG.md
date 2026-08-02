# Changelog

## 1.0.34 – 2026-08-02

- Sichtbare Altbezeichnungen aus der Workbench-Entwicklung wurden in Logo,
  Favicon-Metadaten, PWA-Name und Theme-Anzeige durch die einheitliche
  Produktbezeichnung `ISPConfig HERITAGE` ersetzt.
- Alle Shell-, Login- und PWA-Assets verwenden jetzt denselben Release-basierten
  Cache-Schlüssel. Dadurch können Browser nach einem Theme-Update keine alten
  CSS-, JavaScript-, Logo- oder Manifeststände mehr miteinander mischen.
- Der Cache-Schlüssel entspricht der vollständigen Theme-Version und wird im
  Release-Gate automatisch gegen `VERSION` geprüft.
- Die bestehende technische Theme-ID bleibt zur Abwärtskompatibilität stabil.
- Die Option „angemeldet bleiben“ folgt wieder vollständig dem aktuellen
  ISPConfig-Sessionvertrag und wird bei deaktiviertem Session-Timeout nicht
  mehr als wirkungslose, visuell irreführende Auswahl angeboten.
- Sortierpriorität und Aliasdomain-Quelle besitzen wieder eindeutige
  Label-Eingabefeld-Zuordnungen für korrekten Klickfokus und Screenreader.
- Mail-Quota-Fortschrittsanzeigen liefern wieder einen gültigen numerischen
  `aria-valuenow`-Wert statt einer nicht existierenden Template-Variable.
- ZIP- und TAR.GZ-Release-Artefakte werden deterministisch mit sortierten
  Pfaden, normalisierten Zeitstempeln, Rechten und Besitzermetadaten erzeugt.
- Öffentliche Logo- und Favicon-Assets tragen ausschließlich HERITAGE-Namen;
  interne Arbeitspaket-Kommentare wurden aus allen Theme-Templates entfernt.
- Alle modularen CSS-Quellen wurden aus dem historischen Workbench-Dateinamensraum
  in eindeutige `heritage-*-core.css`-Autoritäten überführt.

## 1.0.33 – 2026-07-31

- Extended compact state columns to E-mail, Web, DNS, file and database server capabilities.
- Added compact SMTP, delivery, IMAP and POP3 disable states to mailbox lists.
- Distinguished enabled services from enabled disable-flags through success and warning semantics.
- Verified server and mailbox tables at desktop, 721-pixel boundary and mobile widths in Light and Dark.

## 1.0.32 – 2026-07-31

- Replaced wide boolean columns for active, locked and remote access states with compact, accessible status indicators.
- Shortened the visible `Remotezugriff` heading to `Remote` while retaining its complete accessible name.
- Reserved stable widths for status and row-action columns, giving content fields more useful space.
- Verified the full navigation at the 721-pixel boundary and the mobile drawer below 670 pixels in Light and Dark.

## 1.0.31 – 2026-07-31

- Tools und Admin besitzen jetzt explizite, stabile Arbeitsflächen.
- Benutzereinstellungen übernehmen nach dynamischen Seitenwechseln keine alten Tabellenklassen mehr.
- Resynchronisierung, ISPConfig-Import, Benutzer, PHP-Versionen, Firewall und IP-Adressen sind Teil der realen Browserabnahme.
- 84 Browserzustände sichern sieben Oberflächen über sechs Breiten und beide Farbschemata ab.

## 1.0.30 – 2026-07-31

- Systemkonfiguration, Extension Installer sowie Monitoring-Daten und -Protokolle besitzen einen gemeinsamen, verbindlichen Oberflächenvertrag.
- Dynamisch geladene Monitoring-Seiten entfernen alte Formularprofile vollständig.
- Lange operative Überschriften bleiben auch in kompakten Zwischenbreiten innerhalb ihres Panels.
- 60 Browserzustände sichern fünf Spezialoberflächen über sechs Breiten und beide Farbschemata ab.

## 1.0.29 – 2026-07-31

- Dashboard und Monitoring besitzen jetzt eine verbindliche reale Browserabnahme.
- Eingebettete Kontingent-Tabellen klassifizieren das Dashboard nicht länger als Listenansicht.
- Vier Systemdiagramme mit 60 Messpunkten werden sichtbar sowie per Maus und Tastatur geprüft.
- Dashboard-Widgets, Monitoring-Panels und Aktualisierungssteuerung sind über sechs Breiten und beide Farbschemata abgesichert.

## 1.0.28 – 2026-07-31

- Das Formularsystem erkennt jetzt die echte, von ISPConfig um den Inhaltsbereich gelegte Formularstruktur.
- Formularmetadaten werden nur auf Detailseiten gesetzt und beim Wechsel zurück zu Listen sauber entfernt.
- Kunden, Webseiten, Datenbanken, Postfächer, DNS-Zonen, Supportnachrichten und Server sind Teil der Formular-V1-Abnahme.
- 240 Laufzeitzustände schützen 20 Oberflächen über sechs Breiten und beide Farbschemata.

## 1.0.27 – 2026-07-31

- Die Tabellen-V1-Abnahme umfasst jetzt 13 reale ISPConfig-Oberflächen.
- Datenbanken, FTP, Cronjobs, Postfächer, Support, Server und Remote-Benutzer ergänzen die Referenzmatrix.
- Historische XMPP- und vServer-Spalten werden in keiner responsiven Darstellung mehr präsentiert.
- 156 Laufzeitzustände schützen Tabellengeometrie, Aktionen, Identitäten und Altmodulgrenzen.

## 1.0.26 – 2026-07-31

- Kunden-, Webseiten-, E-Mail- und DNS-Listen folgen demselben Tabellenvertrag.
- Aktionsspalten bleiben am rechten Tabellenrand ausgerichtet und besitzen eine eindeutige Kopfzeile.
- Veraltete prozentuale Spaltenbreiten beeinflussen die neue Tabellengeometrie nicht mehr.
- Datensatzkennungen erscheinen auf Desktop nicht doppelt und bleiben in mobilen Karten verfügbar.
- Mehrere Erstellen-Aktionen erhalten eine klare primäre und sekundäre Hierarchie.
- Die Laufzeitmatrix deckt 72 Zustände aus sechs Ansichten, sechs Breiten und zwei Farbschemata ab.

## 1.0.25 – 2026-07-31

- Compact desktop navigation no longer exposes a horizontal scrollbar.
- Primary modules share available width evenly between 721 and 1180 pixels.
- HERITAGE retains its horizontal navigation below the legacy 1024-pixel drawer breakpoint.
- Runtime coverage adds a dedicated 740-pixel state in light and dark mode.

## 1.0.24 – 2026-07-31

- Populated tables retain their own bounded horizontal scroll context.
- Dormant legacy empty rows no longer activate empty-state overflow geometry.
- Sticky row actions remain fully visible inside the table viewport.
- Runtime validation rejects controls clipped by either their cell or the visible table surface.

## 1.0.23 – 2026-07-31

- Desktop and tablet primary navigation modules place icons above centered labels.
- The mobile drawer retains its compact horizontal icon-and-label arrangement.
- Runtime validation measures navigation geometry across all tested viewports and colour modes.

## 1.0.22 – 2026-07-31

- Views without a page heading retain accessible programmatic focus without drawing a full-content control ring.
- Runtime validation now rejects unintended focus decoration on every programmatic page target, not only headings.

## 1.0.21 – 2026-07-31

- Standalone favicon references now retain an explicit cache generation.
- Package verification rejects uncached generated favicon references before publication.

## 1.0.20 – 2026-07-31

- Mobile record cards retain their compact record identifier beside the promoted primary value.
- The reusable identity badge follows the active colour mode without changing record links or actions.
- Mobile runtime validation rejects hidden identity columns without a visible summary.

## 1.0.19 – 2026-07-31

- Wide list actions retain a stable sticky width instead of crowding the final controls.
- Programmatic page-title focus remains available to assistive technology without drawing an interactive-control ring.
- Targeted runtime validation now covers light and dark presentation explicitly.
- Browser evidence rejects clipped row actions and accidental page-title focus decoration.

## 1.0.18 – 2026-07-31

- Content enhancement no longer retriggers itself through its own DOM mutations.
- Runtime post-processing is debounced and temporarily disconnects its observer.
- Authenticated module transitions remain responsive under real browser execution.
- A focused browser suite now validates representative surfaces in seconds.

## 1.0.17 – 2026-07-31

- Application JavaScript now uses two reproducible ordered bundles around Chart.js.
- Login JavaScript now uses one dedicated reproducible bundle.
- Modular source scripts remain authoritative and independently maintainable.
- Release validation rejects stale output and enforces bundle order and budgets.

## 1.0.16 – 2026-07-31

- Application CSS now uses one reproducible ordered bundle instead of 25 requests.
- Login CSS now uses one dedicated bundle instead of five requests.
- Modular source styles remain authoritative and independently maintainable.
- Release validation rejects stale output and enforces bundle budgets.

## 1.0.15 – 2026-07-31

- All post-bootstrap login and application scripts now use ordered deferred loading.
- Script downloads no longer serialize parser progress at the end of each shell.
- The release gate rejects new non-deferred runtime scripts.
- The deliberate early colour and language bootstrap remains synchronous.

## 1.0.14 – 2026-07-31

- Removed an unreferenced private test logo from the distributable package.
- Added a complete asset-reference and cache-generation release contract.
- Added source payload budgets and duplicate shell-load protection.
- Only the intentional early bootstrap may block authenticated-shell parsing.

## 1.0.13 – 2026-07-31

- Login and authenticated surfaces now share one accessibility authority.
- Increased contrast, forced system colours and reduced transparency are supported.
- Active navigation remains identifiable without relying on colour alone.
- Reduced motion covers both login and authenticated shells.

## 1.0.12 – 2026-07-31

- German and English theme-owned labels now have a permanent parity gate.
- Dynamically loaded module fragments must retain localization support.
- Live installation verification checks every shell asset for HTTP 200 and content.
- Installed manifest and login route are verified against the exact release version.

## 1.0.11 – 2026-07-31

- Login and authenticated shells now share one current runtime cache contract.
- A permanent V1 acceptance gate verifies packaged shell assets and module boundaries.
- Numbered placeholder actions and obsolete runtime references block future releases.
- Release validation now distinguishes automated contracts from manual visual evidence.

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

- Page headers, status metadata and action groups now share one semantic composition.
- Notices receive stable severity roles and aligned full-width presentation.
- Empty, loading and error states use one centered responsive workspace.
- Mobile page titles and actions retain a predictable left-aligned hierarchy.

## 1.0.6 – 2026-07-31

- Mobile list rows now share one semantic record-card hierarchy across modules.
- Technical identity columns yield their edit target to the primary business value.
- Status fields, primary values and action footers receive stable responsive roles.
- Medium phone widths use compact two-column record details.

## 1.0.5 – 2026-07-31

- Table headings and visible filters remain aligned while scrolling.
- Sort direction is exposed visually and through accessibility semantics.
- Generic row actions receive meaningful German or English labels.

## 1.0.4 – 2026-07-31

- Long forms now summarize explicit validation errors.
- Tabs display compact error counts and can reveal the first invalid field.
- Validation guidance remains theme-only and preserves native submission.

## 1.0.3 – 2026-07-31

- Dashboard module cards now use a compact six-column wide-screen grid.
- Metric charts provide clearer pointer and keyboard interaction feedback.
- Dashboard sections and module density were refined for the full-width canvas.

## 1.0.2 – 2026-07-31

- Improved split-screen and tablet navigation down to 721 pixels.
- Primary labels remain visible below their icons and use concise wording.
- Quick-create controls now match the light navigation surface.

## 1.0.1 – 2026-07-31

- Dashboard uses the full application width when no contextual navigation exists.
- Compact module widgets now form a denser four-column desktop grid.
- Contextual navigation returns automatically on module pages.

## 1.0.0 – 2026-07-31

- First stable HERITAGE release for ISPConfig 3.3.1p1.
- Added standalone light and dark presentation with a horizontal module bar and contextual navigation.
- Completed responsive login, dashboard, tables, forms, dialogs, monitoring, mail and DNS surfaces.
- Validated administrator, reseller, client and mail-user roles.
- Validated Ubuntu 22.04/24.04 and Debian 12/13 with Apache and Nginx.
- Added signed ZIP and TAR.GZ packages with hardened installation, atomic upgrades, backups and rollback.
- Preserved the ISPConfig default theme as the required recovery path.
