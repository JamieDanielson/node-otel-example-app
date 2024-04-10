/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ExpressLayerType } from '@opentelemetry/instrumentation-express';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { ENVIRONMENT } from './constants';

export const instrument = (serviceName: string) => {
  // set to debug to see in console
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: '1.0',
      environment: ENVIRONMENT,
    }),
    traceExporter: configureCompositeExporter([
      // set headers in env vars
      // OTEL_EXPORTER_OTLP_HEADERS: 'x-honeycomb-team=api-key'
      new OTLPTraceExporter(),
      new ConsoleTraceLinkExporter(),
    ]),
    metricReader: new PeriodicExportingMetricReader({
      // set headers in env vars
      exporter: new OTLPMetricExporter(),
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // only instrument fs if it is part of another trace
        '@opentelemetry/instrumentation-fs': {
          requireParentSpan: true,
        },
        '@opentelemetry/instrumentation-express': {
          ignoreLayersType: [
            ExpressLayerType.MIDDLEWARE,
            ExpressLayerType.REQUEST_HANDLER,
          ],
        },
      }),
    ],
  });

  sdk.start();
};
