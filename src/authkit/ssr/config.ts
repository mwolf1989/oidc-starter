import { lazy } from './utils';
import type { OIDCConfig } from './interfaces';

type ValueSource = Record<string, any> | ((key: string) => any);

/**
 * Default environment variable source that uses process.env
 */
const defaultSource: ValueSource = (key: string): string | undefined => {
  try {
    return process.env[key];
  } catch {
    return undefined;
  }
};

/**
 * Configuration class for OIDC.
 * This class is used to manage configuration values and provide defaults.
 * It also provides a way to get configuration values from environment variables.
 * @internal
 */
export class Configuration {
  private config: Partial<OIDCConfig> = {
    cookieName: 'oidc-session',
    // Defaults to 400 days, the maximum allowed by Chrome
    // It's fine to have a long cookie expiry date as the access/refresh tokens
    // act as the actual time-limited aspects of the session.
    cookieMaxAge: 60 * 60 * 24 * 400,
    scope: 'openid profile email',
  };

  private valueSource: ValueSource = defaultSource;

  private readonly requiredKeys: Array<keyof OIDCConfig> = ['clientId', 'clientSecret', 'issuer', 'redirectUri', 'cookiePassword'];

  /**
   * Convert a camelCase string to an uppercase, underscore-separated environment variable name.
   * @param str The string to convert
   * @returns The environment variable name
   */
  protected getEnvironmentVariableName(str: string) {
    return `OIDC_${str.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}`;
  }

  private updateConfig(config: Partial<OIDCConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setValueSource(source: ValueSource): void {
    this.valueSource = source;
  }

  configure(configOrSource: Partial<OIDCConfig> | ValueSource, source?: ValueSource): void {
    if (typeof configOrSource === 'function') {
      this.setValueSource(configOrSource);
    } else if (typeof configOrSource === 'object' && !source) {
      this.updateConfig(configOrSource);
    } else if (typeof configOrSource === 'object' && source) {
      this.updateConfig(configOrSource);
      this.setValueSource(source);
    }

    // Validate the cookiePassword if provided
    if (this.config.cookiePassword && this.config.cookiePassword.length < 32) {
      throw new Error('cookiePassword must be at least 32 characters long');
    }
  }

  getValue<T extends keyof OIDCConfig>(key: T): OIDCConfig[T] {
    // First check environment variables
    const envKey = this.getEnvironmentVariableName(key as string);
    let envValue: OIDCConfig[T] | undefined = undefined;

    const { valueSource, config } = this;
    if (typeof valueSource === 'function') {
      envValue = valueSource(envKey);
    } else {
      envValue = valueSource[envKey];
    }

    // If environment variable exists, use it
    if (envValue != null) {
      // Convert string values to appropriate types
      if (key === 'cookieMaxAge' && typeof envValue === 'string') {
        const num = parseInt(envValue, 10);
        return (isNaN(num) ? undefined : num) as OIDCConfig[T];
      }

      return envValue as OIDCConfig[T];
    }

    // Then check programmatically provided config
    if (key in config && config[key] != undefined) {
      return config[key] as OIDCConfig[T];
    }

    if (this.requiredKeys.includes(key)) {
      throw new Error(`Missing required configuration value for ${String(key)} (${envKey}).`);
    }

    return undefined as OIDCConfig[T];
  }
}

// lazy-instantiate the Configuration instance
const getConfigurationInstance = lazy(() => new Configuration());

/**
 * Configure OIDC with a custom value source.
 * @param source The source of configuration values
 *
 * @example
 * configure(key => Deno.env.get(key));
 */
export function configure(source: ValueSource): void;
/**
 * Configure OIDC with custom values.
 * @param config The configuration values
 *
 * @example
 * configure({
 *    clientId: 'your-client-id',
 *    clientSecret: 'your-client-secret',
 *    issuer: 'https://your-keycloak.com/realms/your-realm',
 *    redirectUri: 'https://your-app.com/auth/callback',
 *    cookiePassword: 'your-cookie-password',
 *  });
 */
export function configure(config: Partial<OIDCConfig>): void;
/**
 * Configure OIDC with custom values and a custom value source.
 * @param config The configuration values
 * @param source The source of configuration values
 *
 * @example
 * configure({
 *   clientId: 'your-client-id',
 * }, env);
 */
export function configure(config: Partial<OIDCConfig>, source: ValueSource): void;
export function configure(configOrSource: Partial<OIDCConfig> | ValueSource, source?: ValueSource): void {
  const config = getConfigurationInstance();
  config.configure(configOrSource, source);
}

/**
 * Get a configuration value by key.
 * This function will first check environment variables, then programmatically provided config,
 * and finally fall back to defaults for optional settings.
 * If a required setting is missing, an error will be thrown.
 * @param key The configuration key
 * @returns The configuration value
 */
export function getConfig<T extends keyof OIDCConfig>(key: T): OIDCConfig[T] {
  const config = getConfigurationInstance();
  return config.getValue(key);
}