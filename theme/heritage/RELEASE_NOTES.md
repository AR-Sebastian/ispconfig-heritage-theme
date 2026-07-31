# ISPConfig HERITAGE 1.0.6

HERITAGE 1.0.6 establishes one responsive record-card system for every
supported module. Technical identifiers no longer dominate phone layouts;
their edit target moves to the primary business value while status and actions
retain a predictable visual position.
It targets ISPConfig 3.3.1p1 and keeps the original `default` theme as the
required recovery path.

Highlights:

- consistent mobile record cards across clients, sites, mail, DNS, support and system;
- compact two-column details on medium phone widths;
- sticky table headings with correctly aligned filter rows;
- localized row-action names instead of generic numbered tooltips;
- visible and accessible sorting direction;
- form-wide summaries for explicit validation errors;
- compact per-tab error counters and first-error navigation;
- compact six-column module destinations on wide dashboards;
- interactive metric points with pointer, touch and keyboard feedback;
- responsive four-, three-, two- and one-column dashboard fallbacks;
- horizontal primary module navigation with contextual secondary navigation;
- complete light and dark colour modes;
- responsive login, dashboard, tables, forms and dialogs;
- role-aware behaviour for administrator, reseller, client and mail-user views;
- tested on Ubuntu 22.04/24.04 and Debian 12/13 with Apache and Nginx;
- verified ZIP and TAR.GZ archives with atomic installation and rollback.

Before installation, verify the selected archive against `SHA256SUMS.txt` or
`SHA256SUMS.json`. Keep ISPConfig's `default` theme installed.
