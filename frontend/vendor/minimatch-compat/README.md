# Patched matcher compatibility

The lint dependency tree mixes callable CommonJS minimatch v3 consumers and
named-export v9/v10 consumers. GHSA-g3hv-75wg-m249 lists versions before 11.0.1.
This adapter delegates both interfaces to upstream 11.0.4. It does not copy old
matching code or suppress npm audit. The alias remains a registry dependency
with its integrity recorded in package-lock.json. Remove the adapter when the
upstream ESLint plugins support the patched named-export interface directly.
