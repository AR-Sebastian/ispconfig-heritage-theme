# Changelog

## 1.0.34 – 2026-08-02

- Public branding is consistently presented as ISPConfig HERITAGE.
- Release-version cache fingerprints prevent mixed old and current assets.
- Login, form-label and mailbox-quota accessibility contracts are corrected.
- Validation permanently protects branding and the repaired UI contracts.
- ZIP and TAR.GZ release artifacts are reproducible and traversal-checked.
- Theme-owned DOM contracts use the HERITAGE namespace while ISPConfig compatibility attributes remain intact.
- Theme-owned lifecycle and interaction events use the `heritage:*` namespace.
- JavaScript-generated DOM state uses `data-heritage-*` consistently, including localized early-boot values.
- Release readiness now explicitly blocks publication on removal of non-stock `workbench_*` controller dependencies.
- Shell, login and Admin settings templates no longer require Workbench-only controller values or the custom branding endpoint.
- Retired branding-editor CSS and its dedicated form profile were removed without changing shared form surfaces.
- Abbreviated `data-wb-*` contracts and their JavaScript dataset properties were migrated to the explicit HERITAGE namespace.
- Theme-owned shell, dialog, navigation, search, tooltip and generated DOM identifiers now use the HERITAGE namespace.
- Internal JavaScript helpers, runtime properties, history state and installation guards now use the HERITAGE namespace.
- Browser preferences migrate once from the retired Workbench storage keys to HERITAGE keys without losing theme or login choices.
- Component classes and CSS custom properties now use the unified `hg-*` / `--hg-*` HERITAGE design namespace.
- Dashboard layout preferences migrate to the HERITAGE storage key; internal runtime names and generated classes no longer expose Workbench-era terminology.
- Release notes and readiness evidence now describe the completed namespace architecture and keep unproven runtime gates explicitly open.
- Dashboard fallback content spans the complete responsive grid instead of collapsing into a narrow implicit column.
- The redundant legacy jQuery donation toggle is skipped safely when the ISPConfig shell does not provide jQuery; unrelated inline scripts remain observable.
- Authenticated Debian 13 desktop/mobile and light/dark smoke evidence is recorded separately from the still-open stock 3.3.1p1 release gate.
- Theme compatibility markers match the literal `3.3dev` ABI exposed by stock ISPConfig 3.3.1p1 while the manifest retains the public release target.
- Managed installation normalizes directory and file permissions before the atomic swap, preventing transport-specific modes from blocking Apache asset delivery.
- Stock-runtime evidence now distinguishes authenticated account theming from ISPConfig's operator-controlled global pre-login theme.

## 1.0.33 – 2026-07-31

- Tools and Admin now expose explicit, stable semantic workspaces.
- Personal settings no longer inherit stale table state after dynamic navigation.
- Resynchronization, ISPConfig import, users, PHP versions, firewall and IP addresses join real-browser acceptance.
- Eighty-four browser states protect seven surfaces across six widths and both colour schemes.

## 1.0.32 – 2026-07-31

- Boolean active, locked and remote-access states use compact accessible indicators.
- Content columns retain more useful width while row actions remain stable.
- The full navigation remains available at 721 pixels and switches below 670 pixels.

## 1.0.31 – 2026-07-31

- Tools and Admin expose explicit, stable semantic workspaces.
- Dynamic navigation clears stale table state before rendering non-table views.
- Seven real surfaces are protected across six widths and both colour schemes.

## 1.0.30 – 2026-07-31

- System configuration, extensions and monitoring share one specialty-surface contract.
- Monitoring navigation removes stale form profiles correctly.
- Long operational headings remain contained at compact intermediate widths.

## 1.0.29 – 2026-07-31

- Dashboard and monitoring received dedicated real-browser acceptance coverage.
- Embedded quota tables no longer classify the dashboard as a list page.
- Charts, widgets and refresh controls are protected across responsive light and dark states.

## 1.0.28 – 2026-07-31

- The form system now recognizes ISPConfig's real outer page-form structure.
- Form metadata is applied only to detail pages and removed cleanly on list navigation.
- Customer, website, database, mailbox, DNS-zone, support-message and server forms join V1 acceptance.
- 240 runtime states protect 20 surfaces across six widths and both colour schemes.

## 1.0.27 – 2026-07-31

- Table V1 acceptance now covers 13 representative ISPConfig surfaces.
- Databases, FTP, cronjobs, mailboxes, support, servers and remote users extend the reference matrix.
- Historical XMPP and vServer columns are not presented at any responsive width.
- 156 runtime states protect geometry, actions, identities and retired-service boundaries.

## 1.0.26 – 2026-07-31

- Customer, website, mail and DNS lists now share one table contract.
- Action columns stay aligned at the right edge and expose an explicit heading.
- Legacy percentage widths no longer distort the current table geometry.
- Desktop records avoid duplicate identity values while mobile cards retain their summaries.
- Toolbars with several create paths distinguish primary and secondary actions.
- Runtime coverage now spans 72 states across six surfaces, six widths and two colour schemes.

## 1.0.25 – 2026-07-31

- Compact desktop navigation no longer exposes a horizontal scrollbar.
- Primary modules share available width evenly between 721 and 1180 pixels.
- HERITAGE retains horizontal navigation below the legacy drawer breakpoint.
- Runtime coverage adds a dedicated 740-pixel state in light and dark mode.

## 1.0.24 – 2026-07-31

- Populated tables retain their own bounded horizontal scroll context.
- Dormant legacy empty rows no longer activate empty-state overflow geometry.
- Sticky row actions remain fully visible inside the table viewport.
- Tablet-width records use an adaptive card layout inside the desktop shell.

## 1.0.23 – 2026-07-31

- Desktop and tablet primary navigation modules place icons above centered labels.
- The mobile drawer retains its compact horizontal icon-and-label arrangement.
- Runtime validation measures navigation geometry across all tested viewports and colour modes.

## 1.0.22 – 2026-07-31

- Views without a page heading retain accessible programmatic focus without drawing a full-content control ring.
- Runtime validation now rejects unintended focus decoration on every programmatic page target.

## 1.0.21 – 2026-07-31

- Standalone favicon references now retain an explicit cache generation.
- Package verification rejects uncached generated favicon references before publication.

## 1.0.20 – 2026-07-31

- Mobile record cards retain their compact record identifier beside the promoted primary value.
- The reusable identity badge follows the active colour mode without changing record links or actions.
- Mobile runtime validation rejects hidden identity columns without a visible summary.

## 1.0.19 – 2026-07-31

- Wide tables reserve stable space for complete row-action groups.
- Row actions align consistently at the trailing table edge.
- Programmatic heading focus no longer resembles an interactive control.
- Runtime coverage now validates both colour modes across desktop, tablet and mobile.

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
