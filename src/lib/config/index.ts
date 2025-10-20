/**
 * Centralized Application Configuration
 * 
 * All environment variables and feature flags are managed here.
 * This provides type safety and centralized control over app configuration.
 */

// ========================================
// Type Definitions
// ========================================

export interface AppConfig {
  // Application
  appUrl: string;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;

  // Database
  databasePath: string;

  // Authentication
  nextAuthUrl: string;
  sessionMaxAge: number;
  sessionSecret?: string;

  // Default Admin User
  defaultAdmin: {
    email: string;
    name: string;
    password: string;
  };

  // Feature Flags
  features: {
    webhooks: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    oauth: boolean;
    ldap: boolean;
  };

  // Logging
  logLevel: 'error' | 'warn' | 'info' | 'debug';

  // Email
  email: {
    enabled: boolean;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      user?: string;
      pass?: string;
    };
    from: {
      email: string;
      name: string;
    };
  };

  // Webhook
  webhook: {
    enabled: boolean;
    secret?: string;
  };

  // OAuth
  oauth: {
    enabled: boolean;
  };

  // LDAP
  ldap: {
    enabled: boolean;
  };

  // SMS
  sms: {
    enabled: boolean;
    provider: 'twilio' | 'vonage' | 'aws-sns';
    twilio?: {
      accountSid?: string;
      authToken?: string;
      fromNumber?: string;
    };
  };

  // Development
  dev: {
    mode: boolean;
    skipEmailVerification: boolean;
  };
}

// ========================================
// Helper Functions
// ========================================

/**
 * Get environment variable as boolean
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Get environment variable as number
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get environment variable as string
 */
function getEnvString(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Check if email is configured
 */
function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Check if LDAP is configured
 */
function isLdapConfigured(): boolean {
  return !!(
    process.env.LDAP_URL &&
    process.env.LDAP_BIND_DN &&
    process.env.LDAP_BIND_PASSWORD &&
    process.env.LDAP_SEARCH_BASE
  );
}

/**
 * Check if any OAuth provider is configured
 */
function isOAuthConfigured(): boolean {
  return !!(
    (process.env.OAUTH_GITHUB_CLIENT_ID && process.env.OAUTH_GITHUB_CLIENT_SECRET) ||
    (process.env.OAUTH_GOOGLE_CLIENT_ID && process.env.OAUTH_GOOGLE_CLIENT_SECRET) ||
    (process.env.OAUTH_MICROSOFT_CLIENT_ID && process.env.OAUTH_MICROSOFT_CLIENT_SECRET) ||
    (process.env.OAUTH_GITLAB_CLIENT_ID && process.env.OAUTH_GITLAB_CLIENT_SECRET) ||
    (process.env.OAUTH_CUSTOM_CLIENT_ID && process.env.OAUTH_CUSTOM_CLIENT_SECRET)
  );
}

/**
 * Check if SMS is configured (Twilio)
 */
function isSmsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );
}

// ========================================
// Configuration Object
// ========================================

const config: AppConfig = {
  // Application
  appUrl: getEnvString('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  nodeEnv: getEnvString('NODE_ENV', 'development'),
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Database
  databasePath: getEnvString('DATABASE_PATH', './orion.db'),

  // Authentication
  nextAuthUrl: getEnvString('NEXT_AUTH_URL', 'http://localhost:3000'),
  sessionMaxAge: getEnvNumber('SESSION_MAX_AGE', 604800), // 7 days default
  sessionSecret: process.env.SESSION_SECRET,

  // Default Admin User
  defaultAdmin: {
    email: getEnvString('DEFAULT_ADMIN_EMAIL', 'admin@orion.local'),
    name: getEnvString('DEFAULT_ADMIN_NAME', 'Administrator'),
    password: getEnvString('DEFAULT_ADMIN_PASSWORD', 'admin123'),
  },

  // Feature Flags
  features: {
    webhooks: getEnvBoolean('ENABLE_WEBHOOKS', true),
    emailNotifications: getEnvBoolean('ENABLE_EMAIL_NOTIFICATIONS', true) && isEmailConfigured(),
    smsNotifications: getEnvBoolean('ENABLE_SMS_NOTIFICATIONS', false) && isSmsConfigured(),
    oauth: getEnvBoolean('ENABLE_OAUTH', true) && isOAuthConfigured(),
    ldap: getEnvBoolean('ENABLE_LDAP', true) && isLdapConfigured(),
  },

  // Logging
  logLevel: (getEnvString('LOG_LEVEL', 'info') as 'error' | 'warn' | 'info' | 'debug'),

  // Email
  email: {
    enabled: isEmailConfigured() && getEnvBoolean('ENABLE_EMAIL_NOTIFICATIONS', true),
    smtp: {
      host: getEnvString('SMTP_HOST', 'smtp.gmail.com'),
      port: getEnvNumber('SMTP_PORT', 587),
      secure: getEnvBoolean('SMTP_SECURE', false),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: {
      email: getEnvString('FROM_EMAIL', 'orion@example.com'),
      name: getEnvString('FROM_NAME', 'Project Orion'),
    },
  },

  // Webhook
  webhook: {
    enabled: getEnvBoolean('ENABLE_WEBHOOKS', true),
    secret: process.env.WEBHOOK_SECRET,
  },

  // OAuth
  oauth: {
    enabled: isOAuthConfigured() && getEnvBoolean('ENABLE_OAUTH', true),
  },

  // LDAP
  ldap: {
    enabled: isLdapConfigured() && getEnvBoolean('ENABLE_LDAP', true),
  },

  // SMS
  sms: {
    enabled: isSmsConfigured() && getEnvBoolean('ENABLE_SMS_NOTIFICATIONS', false),
    provider: (getEnvString('SMS_PROVIDER', 'twilio') as 'twilio' | 'vonage' | 'aws-sns'),
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
    },
  },

  // Development
  dev: {
    mode: getEnvBoolean('NEXT_PUBLIC_DEV_MODE', false),
    skipEmailVerification: getEnvBoolean('SKIP_EMAIL_VERIFICATION', false),
  },
};

// ========================================
// Validation
// ========================================

/**
 * Validate configuration and log warnings
 */
function validateConfig() {
  const warnings: string[] = [];

  // Production checks
  if (config.isProduction) {
    if (!config.sessionSecret) {
      warnings.push('SESSION_SECRET is not set in production. Using default (insecure).');
    }
    if (config.appUrl.includes('localhost')) {
      warnings.push('NEXT_PUBLIC_APP_URL should not use localhost in production.');
    }
    if (!config.email.enabled) {
      warnings.push('Email notifications are disabled. Users will not receive incident alerts.');
    }
  }

  // Email configuration
  if (config.features.emailNotifications && !config.email.enabled) {
    warnings.push('ENABLE_EMAIL_NOTIFICATIONS is true but email is not configured properly.');
  }

  // OAuth configuration
  if (config.features.oauth && !config.oauth.enabled) {
    warnings.push('ENABLE_OAUTH is true but no OAuth providers are configured.');
  }

  // LDAP configuration
  if (config.features.ldap && !config.ldap.enabled) {
    warnings.push('ENABLE_LDAP is true but LDAP is not configured properly.');
  }

  // SMS configuration
  if (config.features.smsNotifications && !config.sms.enabled) {
    warnings.push('ENABLE_SMS_NOTIFICATIONS is true but SMS is not configured properly.');
  }

  // Webhook security
  if (config.webhook.enabled && !config.webhook.secret && config.isProduction) {
    warnings.push('WEBHOOK_SECRET is not set. Webhooks will not be secure.');
  }

  // Log warnings
  if (warnings.length > 0 && config.logLevel !== 'error') {
    console.warn('⚠️  Configuration Warnings:');
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }

  // Log feature status in development
  if (config.isDevelopment && config.logLevel === 'debug') {
    console.log('🔧 Feature Flags:');
    console.log(`   - Webhooks: ${config.features.webhooks ? '✅' : '❌'}`);
    console.log(`   - Email Notifications: ${config.features.emailNotifications ? '✅' : '❌'}`);
    console.log(`   - SMS Notifications: ${config.features.smsNotifications ? '✅' : '❌'}`);
    console.log(`   - OAuth: ${config.features.oauth ? '✅' : '❌'}`);
    console.log(`   - LDAP: ${config.features.ldap ? '✅' : '❌'}`);
  }
}

// Run validation on import
validateConfig();

// ========================================
// Exports
// ========================================

export default config;

/**
 * Helper to check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
  return config.features[feature];
}

/**
 * Helper to get the app URL
 */
export function getAppUrl(): string {
  return config.appUrl;
}

/**
 * Helper to check if running in development
 */
export function isDevelopment(): boolean {
  return config.isDevelopment;
}

/**
 * Helper to check if running in production
 */
export function isProduction(): boolean {
  return config.isProduction;
}

/**
 * Logger with respect to log level
 */
export const logger = {
  error: (...args: any[]) => {
    console.error(...args);
  },
  warn: (...args: any[]) => {
    if (['warn', 'info', 'debug'].includes(config.logLevel)) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (['info', 'debug'].includes(config.logLevel)) {
      console.log(...args);
    }
  },
  debug: (...args: any[]) => {
    if (config.logLevel === 'debug') {
      console.log(...args);
    }
  },
};
