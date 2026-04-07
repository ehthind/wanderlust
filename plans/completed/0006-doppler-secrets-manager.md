# 0006 Doppler Secrets Manager

## Summary
Move Wanderlust to a Doppler-backed service-token secrets model with:
- startup-cached runtime secret loading for the web app and Temporal worker
- direct Doppler CLI access for agents, Symphony hooks, and local development
- explicit preflight checks instead of `doppler run` environment injection
- docs and local defaults that make the global secret source clear

## Progress
- [x] replace sync env-only runtime config with async Doppler-backed loading
- [x] add direct Doppler CLI helpers for scripts and Symphony hooks
- [x] guard local dev and Symphony commands with secret-manager preflight
- [x] update docs, examples, and plan index for the new secrets model
