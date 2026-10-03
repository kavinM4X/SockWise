import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://tempo:4318';
const serviceName = process.env.OTEL_SERVICE_NAME || 'sockwise-backend';

// Set up the OTLP HTTP trace exporter (targets Tempo's HTTP OTLP receiver)
const traceExporter = new OTLPTraceExporter({
  url: `${endpoint}/v1/traces`,
});

// Configure NodeSDK with automatic instrumentations (HTTP, Express, Mongoose, etc.)
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable noisy filesystem I/O tracing to keep spans focused on API/DB
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});

// Start tracing SDK
try {
  sdk.start();
  console.log(`[OpenTelemetry] Distributed tracing initialized: ${serviceName} -> ${endpoint}`);
} catch (error) {
  console.error('[OpenTelemetry] Failed to initialize tracing SDK:', error);
}

// Graceful termination handlers
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('[OpenTelemetry] Tracing terminated on SIGTERM'))
    .catch((error) => console.error('[OpenTelemetry] Error terminating tracing', error));
});

process.on('SIGINT', () => {
  sdk
    .shutdown()
    .then(() => console.log('[OpenTelemetry] Tracing terminated on SIGINT'))
    .catch((error) => console.error('[OpenTelemetry] Error terminating tracing', error));
});

export default sdk;
