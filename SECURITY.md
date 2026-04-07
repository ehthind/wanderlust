# Security

## Defaults
- Secrets come from Doppler using a scoped service token and runtime fetch, never hardcoded files.
- Provider implementations are behind explicit interfaces.
- Boundary parsing is required for external data.
- Symphony hooks must not write outside the workspace root except for temp artifacts.
- Run artifacts may include metadata, but never raw credentials or full secret values.
- GitHub and Linear write authority for Symphony-run agents is limited to the delivery loop described in the repo docs.

## First-slice limitations
- Fake providers are still used for product behavior, but managed credentials now come from Doppler when runtime integrations need them.
- Test runs may use `WANDERLUST_SECRETS_MODE=env` to avoid depending on live secret infrastructure.
- Managed observability exports are optional and should stay disabled in local-first runs unless explicit credentials are present.
