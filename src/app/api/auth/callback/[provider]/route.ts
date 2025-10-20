import { NextRequest, NextResponse } from 'next/server';
import { getOAuthConfigs, handleOAuthCallback } from '@/lib/auth/auth-oauth';
import { createSession } from '@/lib/auth';
import appConfig, { isFeatureEnabled } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  // Check if OAuth is enabled
  if (!isFeatureEnabled('oauth')) {
    return NextResponse.redirect(
      `${appConfig.nextAuthUrl}/login?error=oauth_disabled`
    );
  }

  try {
    const { provider } = params;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth error
    if (error) {
      return NextResponse.redirect(
        `${appConfig.nextAuthUrl}/login?error=${encodeURIComponent(error)}`
      );
    }

    // Verify code and state
    if (!code || !state) {
      return NextResponse.redirect(
        `${appConfig.nextAuthUrl}/login?error=missing_parameters`
      );
    }

    // Verify state (CSRF protection)
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${appConfig.nextAuthUrl}/login?error=invalid_state`
      );
    }

    // Get OAuth config
    const configs = getOAuthConfigs();
    const oauthConfig = configs.get(provider);

    if (!oauthConfig) {
      return NextResponse.redirect(
        `${appConfig.nextAuthUrl}/login?error=provider_not_configured`
      );
    }

    // Handle OAuth callback
    const user = await handleOAuthCallback(provider, code, oauthConfig);

    if (!user) {
      return NextResponse.redirect(
        `${appConfig.nextAuthUrl}/login?error=authentication_failed`
      );
    }

    // Create session
    const session = createSession(user.id);

    // Redirect to home with session cookie
    const response = NextResponse.redirect(appConfig.nextAuthUrl);
    
    response.cookies.set('session_token', session.token, {
      httpOnly: true,
      secure: appConfig.isProduction,
      sameSite: 'lax',
      maxAge: appConfig.sessionMaxAge,
      path: '/',
    });

    // Clear OAuth state cookie
    response.cookies.delete('oauth_state');

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${appConfig.nextAuthUrl}/login?error=internal_error`
    );
  }
}
