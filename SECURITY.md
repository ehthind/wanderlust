# Security

## Defaults
- Secrets come from environment variables or Doppler, never hardcoded files.
- Provider implementations are behind explicit interfaces.
- Boundary parsing is required for external data.
- Symphony hooks must not write outside the workspace root except for temp artifacts.
- Run artifacts may include metadata, but never raw credentials or full secret values.
- GitHub and Linear write authority for Symphony-run agents is limited to the delivery loop described in the repo docs.

## First-slice limitations
- No live vendor credentials are required for the scaffold.
- Fake providers are used for local boot and tests.
- Managed observability exports are optional and should stay disabled in local-first runs unless explicit credentials are present.
