import { getRuntimeConfig } from './runtime-config';

// Railway supplies API and Stripe public configuration at server startup.
export const environment = {
  production: false,
  get apiUrl(): string {
    return getRuntimeConfig()?.apiUrl ?? '';
  },
  get stripePublishableKey(): string {
    return getRuntimeConfig()?.stripePublishableKey ?? '';
  },
  buildId: '2026-01-09-1',
  runtimeConfigEnabled: true,
};
