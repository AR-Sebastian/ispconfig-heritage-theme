# ISPConfig HERITAGE 1.0.14

HERITAGE 1.0.14 is a package and loading hygiene release for the stable V1 line.

## Improvements

- every distributed asset is now required to be referenced by theme source;
- every shell asset has an explicit browser cache generation;
- duplicate asset loading within a shell fails validation;
- the source payload and individual file sizes have explicit budgets;
- only the deliberate early bootstrap may block authenticated-shell parsing;
- an obsolete private test logo has been removed from the public package.

The theme remains presentation-only and targets ISPConfig 3.3.1p1. ISPConfig's
original `default` theme remains the required recovery path.
