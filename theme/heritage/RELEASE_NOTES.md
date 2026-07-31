# ISPConfig HERITAGE 1.0.11

HERITAGE 1.0.11 closes the V1 acceptance contract for every packaged shell,
supported module boundary and public release artifact. The login and authenticated
shells now share the same runtime cache generation, preventing a stale login asset
after upgrades.

HERITAGE 1.0.10 established one specialty-module language for dashboard,
monitoring, system, billing and extensions. Their heroes, panels, tools and
status regions now retain the same hierarchy from desktop to narrow phones.
It targets ISPConfig 3.3.1p1 and keeps the original `default` theme as the
required recovery path.

Highlights:

- shared specialty workspace, hero, panel and action contracts;
- aligned information density across core and optional modules;
- responsive module panels and toolbars;
- accessible module and panel landmarks;
- semantic dialog tone, description and action-group contracts;
- consistent severity styling and accessible live regions;
- pause-aware lifetime indicators for temporary feedback;
- predictable safe-first desktop and mobile dialog actions;
- unified semantic form sections and field groups;
- accessible required, invalid, disabled and supporting-text states;
- predictable primary, secondary and destructive action order;
- density-aware compact and long-form composition;
- unified page headers, status metadata and action groups;
- severity-aware notices and centered content states;
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
