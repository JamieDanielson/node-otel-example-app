import { NodeSDK } from '@opentelemetry/sdk-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { configureCompositeExporter } from './composite-exporter';
import { ConsoleTraceLinkExporter } from './spanlinkexporter';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import {
  ExpressInstrumentation,
  ExpressLayerType,
} from '@opentelemetry/instrumentation-express';

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
// set to debug to see in console
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'js-backend',
    [SEMRESATTRS_SERVICE_VERSION]: '1.0',
    'my-attribute': 'my-value',
  }),
  traceExporter: configureCompositeExporter([
    new OTLPTraceExporter(),
    new ConsoleTraceLinkExporter(),
  ]),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
  }),
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation({
      // ignoreLayersType: [
        // ExpressLayerType.MIDDLEWARE,
        // ExpressLayerType.REQUEST_HANDLER,
        // ExpressLayerType.ROUTER,
      // ],
    }),
  ],
});

sdk.start();
