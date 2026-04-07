# Domain Layering

Each domain uses the same file shape:
- `types.ts`
- `config.ts`
- `repo.ts`
- `service.ts`
- `runtime.ts`
- `ui.ts`
- `index.ts`

## Dependency rule
- `types` imports no same-domain layers
- `config` may import `types`
- `repo` may import `config` and `types`
- `service` may import `repo`, `config`, `types`, and provider interfaces
- `runtime` may import `service`, `repo`, `config`, and `types`
- `ui` may import any earlier same-domain layer

Cross-domain imports should target public `index.ts` exports only.
