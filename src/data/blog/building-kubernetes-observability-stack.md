---
title: "Building a Kubernetes Observability Stack"
description: "A practical guide to implementing observability in Kubernetes using Prometheus, Grafana, and OpenTelemetry for production-grade monitoring."
publishedDate: 2026-02-11
tags: ["kubernetes", "observability", "cloud-native", "devops"]
draft: false
---

Running workloads on Kubernetes without observability is like flying blind. You might get away with it in dev, but production demands visibility into what every service is doing, why latency just spiked, and where that memory leak is hiding. After running Kubernetes clusters since before the 1.0 release, I have seen monitoring evolve from ad-hoc log tailing to fully integrated observability platforms. Here is how I approach building one from scratch.

## The Three Pillars of Observability

Observability rests on three complementary signal types: **metrics**, **logs**, and **traces**. Each answers a different question. Metrics tell you *what* is happening (CPU at 90%, request rate doubled). Logs tell you *why* something happened (stack trace from an unhandled exception). Traces tell you *where* time is spent across service boundaries (the auth service added 200ms to every checkout request).

A robust observability stack collects all three, correlates them, and makes them queryable from a single pane of glass. The combination of **Prometheus** for metrics, a log aggregator like **Loki** or the EFK stack for logs, and **OpenTelemetry** for distributed traces covers the full spectrum.

## Prometheus and Grafana for Metrics

Prometheus is the de facto standard for Kubernetes metrics. It scrapes HTTP endpoints exposed by your applications and infrastructure components on a configurable interval. Here is a minimal scrape configuration that targets pods with a `prometheus.io/scrape: "true"` annotation:

```yaml
# prometheus-config.yaml
scrape_configs:
  - job_name: "kubernetes-pods"
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
```

Grafana connects to Prometheus as a data source and provides dashboards for visualizing these metrics. The community maintains excellent dashboards for node-level stats, pod resource usage, and API server health. I recommend starting with dashboard ID `315` (Kubernetes cluster monitoring) and customizing from there.

## Instrumenting with OpenTelemetry

Where Prometheus handles infrastructure metrics, OpenTelemetry handles application-level telemetry. The OpenTelemetry SDK is vendor-neutral, meaning you can export traces to Jaeger, Zipkin, Grafana Tempo, or any OTLP-compatible backend without changing your instrumentation code.

Here is how you might initialize the OpenTelemetry Node.js SDK in a Kubernetes microservice:

```typescript
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "my-service",
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://otel-collector:4317",
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
console.log("OpenTelemetry tracing initialized");
```

The `auto-instrumentations-node` package automatically instruments popular libraries like Express, `pg`, and `ioredis`, so you get trace spans for HTTP requests and database queries without writing manual span code.

## Putting It All Together

The real power emerges when you correlate signals. Grafana supports Prometheus, Loki, and Tempo as data sources simultaneously. You can click from a spike in a Prometheus latency metric to the exact Tempo trace that caused it, then jump to the corresponding Loki log lines. This correlation slashes mean-time-to-resolution from hours to minutes.

For Kubernetes-native deployments, I recommend the **kube-prometheus-stack** Helm chart as a starting point. It bundles Prometheus Operator, Grafana, Alertmanager, and a curated set of recording rules and alerts. Layer OpenTelemetry Collector on top as a DaemonSet, and you have a production-grade observability foundation that scales with your cluster.

Observability is not a one-time setup. Treat it as a living system: review alert thresholds quarterly, archive noisy dashboards, and keep your instrumentation coverage expanding as new services ship. Your future self debugging a 3 AM incident will thank you.
