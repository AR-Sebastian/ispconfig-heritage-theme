# ISPConfig HERITAGE 1.0.17

HERITAGE 1.0.17 introduces a deterministic JavaScript delivery pipeline.

- application runtime scripts are delivered in two ordered bundles around Chart.js;
- login runtime scripts are delivered in one dedicated bundle;
- the early colour and language bootstrap intentionally remains synchronous;
- modular source scripts remain the maintained authority;
- a JSON manifest fixes runtime order explicitly;
- validation rejects stale generated output and enforces payload budgets.

The signed package passed installation, checksum, update, rollback, authenticated
rendering and live asset-delivery checks. ISPConfig functionality remains unchanged.
