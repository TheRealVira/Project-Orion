import { NextRequest, NextResponse } from 'next/server';
import { getOAuthConfigs, handleOAuthCallback } from '@/lib/auth-oauth';
import { createSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth error
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=${encodeURIComponent(error)}`
      );
    }

    // Verify code and state
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=missing_parameters`
      );
    }

    // Verify state (CSRF protection)
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=invalid_state`
      );
    }

    // Get OAuth config
    const configs = getOAuthConfigs();
    const config = configs.get(provider);

    if (!config) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=provider_not_configured`
      );
    }

    // Handle OAuth callback
    const user = await handleOAuthCallback(provider, code, config);

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=authentication_failed`
      );
    }

    // Create session
    const session = createSession(user.id);

    // Redirect to home with session cookie
    const response = NextResponse.redirect(process.env.NEXTAUTH_URL || 'http://localhost:3000');
    
    response.cookies.set('session_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Clear OAuth state cookie
    response.cookies.delete('oauth_state');

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/login?error=internal_error`
    );
  }
}
