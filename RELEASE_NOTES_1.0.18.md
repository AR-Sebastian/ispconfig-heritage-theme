# ISPConfig HERITAGE 1.0.18

HERITAGE 1.0.18 is a runtime stability and responsiveness release.

- the content observer no longer reacts recursively to theme-owned changes;
- mutation bursts are debounced before enhancement work begins;
- observation is suspended while HERITAGE updates the loaded surface;
- representative customer, website, mail, DNS, monitoring and settings views were tested at desktop, tablet and mobile sizes;
- all 18 tested states passed without viewport overflow, escaped content or browser errors.

The signed package also passed installation, checksum, update, rollback,
authenticated rendering and deterministic asset validation. ISPConfig business
logic, APIs and provisioning remain unchanged.
