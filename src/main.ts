import { RuntimeConfig, setRuntimeConfig } from './environments/runtime-config';
import { environment } from './environments/environment';

async function loadRailwayRuntimeConfig(): Promise<void> {
  const response = await fetch('/runtime-config.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Runtime configuration request failed with HTTP ${response.status}.`);
  }

  const config = (await response.json()) as Partial<RuntimeConfig>;
  if (!config.apiUrl || !config.stripePublishableKey) {
    throw new Error('Runtime configuration is missing API_URL or STRIPE_PUBLISHABLE_KEY.');
  }

  setRuntimeConfig({
    apiUrl: config.apiUrl,
    stripePublishableKey: config.stripePublishableKey,
  });
}

async function bootstrap(): Promise<void> {
  if (environment.runtimeConfigEnabled) {
    await loadRailwayRuntimeConfig();
  }

  const [{ bootstrapApplication }, { AppComponent }, { appConfig }] = await Promise.all([
    import('@angular/platform-browser'),
    import('./app/app.component'),
    import('./app/app.config'),
  ]);

  await bootstrapApplication(AppComponent, appConfig);
}

bootstrap().catch((error: unknown) => {
  console.error('Gwiz startup failed.', error);
  document.body.textContent = 'The application could not start. Please contact support.';
});
