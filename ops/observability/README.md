# Local Observability

This directory holds the disposable local observability stack used by Symphony workspaces.

## Components
- `compose.yml`: local Grafana-compatible stack plus OTEL collector
- `otel-collector-config.yml`: collector pipeline for logs, traces, and metrics

## Usage
- the workspace hook writes endpoint metadata into `.symphony/observability.json`
- local runs can stay in metadata-only mode if Docker is unavailable
- managed sinks such as Sentry and PostHog remain optional
