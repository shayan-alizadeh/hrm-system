type Environment = 'development' | 'test' | 'production';

function requireString(config: Record<string, unknown>, key: string): string {
  const value = config[key];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Environment variable "${key}" is required`);
  }

  return value.trim();
}

function parseInteger(
  value: unknown,
  key: string,
  defaultValue: number,
  min: number,
  max: number,
): number {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(
      `Environment variable "${key}" must be an integer between ${min} and ${max}`,
    );
  }

  return parsed;
}

function parseBoolean(value: unknown, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  if (value === true || value === 'true' || value === '1') {
    return true;
  }

  if (value === false || value === 'false' || value === '0') {
    return false;
  }

  throw new Error(`Invalid boolean value: ${String(value)}`);
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const nodeEnv = (config.NODE_ENV as Environment | undefined) ?? 'development';

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const port = parseInteger(config.PORT, 'PORT', 3001, 1, 65535);

  const databasePort = parseInteger(
    config.DATABASE_PORT,
    'DATABASE_PORT',
    3306,
    1,
    65535,
  );

  const connectionLimit = parseInteger(
    config.DATABASE_CONNECTION_LIMIT,
    'DATABASE_CONNECTION_LIMIT',
    5,
    1,
    100,
  );

  const swaggerEnabled = parseBoolean(
    config.SWAGGER_ENABLED,
    nodeEnv !== 'production',
  );

  return {
    ...config,

    NODE_ENV: nodeEnv,

    APP_NAME: typeof config.APP_NAME === 'string' ? config.APP_NAME : 'HR API',

    PORT: port,

    CORS_ORIGINS: requireString(config, 'CORS_ORIGINS'),

    DATABASE_HOST: requireString(config, 'DATABASE_HOST'),

    DATABASE_USER: requireString(config, 'DATABASE_USER'),

    DATABASE_PASSWORD: requireString(config, 'DATABASE_PASSWORD'),

    DATABASE_NAME: requireString(config, 'DATABASE_NAME'),

    DATABASE_PORT: databasePort,

    DATABASE_CONNECTION_LIMIT: connectionLimit,

    SWAGGER_ENABLED: swaggerEnabled,
  };
}
