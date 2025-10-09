import { createUser, getUserByEmail, User } from './auth';
import appConfig from './config';

export interface OAuthConfig {
  provider: string;
  clientId: string;
  clientSecret: string;
  authorizationURL: string;
  tokenURL: string;
  userInfoURL: string;
  scope: string;
  redirectURI: string;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Get OAuth configurations from environment variables
 */
export function getOAuthConfigs(): Map<string, OAuthConfig> {
  const configs = new Map<string, OAuthConfig>();

  // GitHub OAuth
  if (process.env.OAUTH_GITHUB_CLIENT_ID && process.env.OAUTH_GITHUB_CLIENT_SECRET) {
    configs.set('github', {
      provider: 'github',
      clientId: process.env.OAUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET,
      authorizationURL: 'https://github.com/login/oauth/authorize',
      tokenURL: 'https://github.com/login/oauth/access_token',
      userInfoURL: 'https://api.github.com/user',
      scope: 'user:email',
      redirectURI: process.env.OAUTH_GITHUB_REDIRECT_URI || `${appConfig.nextAuthUrl}/api/auth/callback/github`,
    });
  }

  // Google OAuth
  if (process.env.OAUTH_GOOGLE_CLIENT_ID && process.env.OAUTH_GOOGLE_CLIENT_SECRET) {
    configs.set('google', {
      provider: 'google',
      clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
      userInfoURL: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scope: 'openid email profile',
      redirectURI: process.env.OAUTH_GOOGLE_REDIRECT_URI || `${appConfig.nextAuthUrl}/api/auth/callback/google`,
    });
  }

  // Microsoft OAuth (Azure AD)
  if (process.env.OAUTH_MICROSOFT_CLIENT_ID && process.env.OAUTH_MICROSOFT_CLIENT_SECRET) {
    const tenant = process.env.OAUTH_MICROSOFT_TENANT || 'common';
    configs.set('microsoft', {
      provider: 'microsoft',
      clientId: process.env.OAUTH_MICROSOFT_CLIENT_ID,
      clientSecret: process.env.OAUTH_MICROSOFT_CLIENT_SECRET,
      authorizationURL: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      userInfoURL: 'https://graph.microsoft.com/v1.0/me',
      scope: 'openid email profile',
      redirectURI: process.env.OAUTH_MICROSOFT_REDIRECT_URI || `${appConfig.nextAuthUrl}/api/auth/callback/microsoft`,
    });
  }

  // GitLab OAuth
  if (process.env.OAUTH_GITLAB_CLIENT_ID && process.env.OAUTH_GITLAB_CLIENT_SECRET) {
    const gitlabUrl = process.env.OAUTH_GITLAB_URL || 'https://gitlab.com';
    configs.set('gitlab', {
      provider: 'gitlab',
      clientId: process.env.OAUTH_GITLAB_CLIENT_ID,
      clientSecret: process.env.OAUTH_GITLAB_CLIENT_SECRET,
      authorizationURL: `${gitlabUrl}/oauth/authorize`,
      tokenURL: `${gitlabUrl}/oauth/token`,
      userInfoURL: `${gitlabUrl}/api/v4/user`,
      scope: 'read_user',
      redirectURI: process.env.OAUTH_GITLAB_REDIRECT_URI || `${appConfig.nextAuthUrl}/api/auth/callback/gitlab`,
    });
  }

  // Generic OAuth (for custom providers)
  if (process.env.OAUTH_CUSTOM_CLIENT_ID && process.env.OAUTH_CUSTOM_CLIENT_SECRET) {
    configs.set('custom', {
      provider: 'custom',
      clientId: process.env.OAUTH_CUSTOM_CLIENT_ID,
      clientSecret: process.env.OAUTH_CUSTOM_CLIENT_SECRET,
      authorizationURL: process.env.OAUTH_CUSTOM_AUTHORIZATION_URL || '',
      tokenURL: process.env.OAUTH_CUSTOM_TOKEN_URL || '',
      userInfoURL: process.env.OAUTH_CUSTOM_USER_INFO_URL || '',
      scope: process.env.OAUTH_CUSTOM_SCOPE || 'openid email profile',
      redirectURI: process.env.OAUTH_CUSTOM_REDIRECT_URI || `${appConfig.nextAuthUrl}/api/auth/callback/custom`,
    });
  }

  return configs;
}

/**
 * Generate OAuth authorization URL
 */
export function generateAuthorizationURL(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectURI,
    response_type: 'code',
    scope: config.scope,
    state,
  });

  return `${config.authorizationURL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  config: OAuthConfig,
  code: string
): Promise<{ access_token: string; token_type: string; scope: string }> {
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectURI,
    grant_type: 'authorization_code',
  });

  const response = await fetch(config.tokenURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch user info from OAuth provider
 */
export async function fetchOAuthUserInfo(
  config: OAuthConfig,
  accessToken: string
): Promise<OAuthUserInfo> {
  const response = await fetch(config.userInfoURL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.statusText}`);
  }

  const data = await response.json();

  // Normalize user info based on provider
  return normalizeOAuthUserInfo(config.provider, data);
}

/**
 * Normalize user info from different OAuth providers
 */
function normalizeOAuthUserInfo(provider: string, data: any): OAuthUserInfo {
  switch (provider) {
    case 'github':
      return {
        id: data.id.toString(),
        email: data.email || '',
        name: data.name || data.login,
        avatarUrl: data.avatar_url,
      };

    case 'google':
      return {
        id: data.id || data.sub,
        email: data.email,
        name: data.name,
        avatarUrl: data.picture,
      };

    case 'microsoft':
      return {
        id: data.id,
        email: data.mail || data.userPrincipalName,
        name: data.displayName,
        avatarUrl: undefined,
      };

    case 'gitlab':
      return {
        id: data.id.toString(),
        email: data.email,
        name: data.name || data.username,
        avatarUrl: data.avatar_url,
      };

    default:
      // Generic normalization for custom providers
      return {
        id: data.id || data.sub || '',
        email: data.email || '',
        name: data.name || data.display_name || data.username || '',
        avatarUrl: data.avatar_url || data.picture || undefined,
      };
  }
}

/**
 * Handle OAuth callback and create/update user
 */
export async function handleOAuthCallback(
  provider: string,
  code: string,
  config: OAuthConfig
): Promise<User | null> {
  try {
    // Exchange code for token
    const tokenData = await exchangeCodeForToken(config, code);

    // Fetch user info
    const userInfo = await fetchOAuthUserInfo(config, tokenData.access_token);

    if (!userInfo.email) {
      console.error('OAuth user missing email');
      return null;
    }

    // Find or create user
    let user = getUserByEmail(userInfo.email);

    if (!user) {
      // Create new user from OAuth with viewer role by default
      user = await createUser({
        email: userInfo.email,
        name: userInfo.name,
        role: 'viewer', // External OAuth users start as viewers
        authProvider: 'oauth',
        authProviderId: `${provider}:${userInfo.id}`,
        avatarUrl: userInfo.avatarUrl,
      });
      console.log('Created new OAuth user as viewer:', userInfo.email);
    } else if (user.authProvider !== 'oauth') {
      console.error('User exists with different auth provider:', userInfo.email);
      return null;
    }

    return user;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return null;
  }
}

/**
 * Get available OAuth providers
 */
export function getAvailableOAuthProviders(): string[] {
  return Array.from(getOAuthConfigs().keys());
}
