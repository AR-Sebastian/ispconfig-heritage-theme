# ISPConfig HERITAGE 1.0.15

HERITAGE 1.0.15 improves real browser loading without changing ISPConfig behaviour.

## Improvements

- all post-bootstrap login and application scripts use ordered deferred loading;
- browsers may download runtime files in parallel;
- dependency execution order remains unchanged;
- scripts still initialize before `DOMContentLoaded`;
- the early colour and language bootstrap remains the only synchronous script;
- public validation rejects future parser-blocking runtime regressions.

The signed archive passed login, dashboard, theme-selection and referenced-asset
checks in the disposable Ubuntu laboratory. The theme remains presentation-only
and targets ISPConfig 3.3.1p1.
