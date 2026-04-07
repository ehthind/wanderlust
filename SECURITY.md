# Security

## Defaults
- Secrets come from environment variables or Doppler, never hardcoded files.
- Provider implementations are behind explicit interfaces.
- Boundary parsing is required for external data.
- Symphony hooks must not write outside the workspace root except for temp artifacts.

## First-slice limitations
- No live vendor credentials are required for the scaffold.
- Fake providers are used for local boot and tests.
