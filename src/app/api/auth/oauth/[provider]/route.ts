import { NextRequest, NextResponse } from 'next/server';
import { getOAuthConfigs, generateAuthorizationURL } from '@/lib/auth-oauth';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
    const configs = getOAuthConfigs();
    const config = configs.get(provider);

    if (!config) {
      return NextResponse.json(
        { error: 'OAuth provider not configured' },
        { status: 400 }
      );
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Generate authorization URL
    const authUrl = generateAuthorizationURL(config, state);

    // Store state in cookie for verification in callback
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth authorization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
