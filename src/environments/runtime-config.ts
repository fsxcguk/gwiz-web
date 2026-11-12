export interface RuntimeConfig {
  apiUrl: string;
  stripePublishableKey: string;
}

let runtimeConfig: RuntimeConfig | null = null;

export function setRuntimeConfig(config: RuntimeConfig): void {
  runtimeConfig = config;
}

export function getRuntimeConfig(): RuntimeConfig | null {
  return runtimeConfig;
}
