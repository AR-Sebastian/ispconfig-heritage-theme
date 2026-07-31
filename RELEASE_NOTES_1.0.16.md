# ISPConfig HERITAGE 1.0.16

HERITAGE 1.0.16 introduces a deterministic CSS delivery pipeline.

- application stylesheet requests decrease from 25 to one;
- login stylesheet requests decrease from five to one;
- modular source files remain the maintained authority;
- a JSON manifest fixes cascade order explicitly;
- validation rejects stale generated output;
- runtime and authored-source budgets are enforced.

The signed package passed installation, checksum, update, rollback and live asset
delivery checks. ISPConfig functionality remains unchanged.
