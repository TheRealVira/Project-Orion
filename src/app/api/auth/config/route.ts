import { NextRequest, NextResponse } from 'next/server';
import { getAvailableOAuthProviders } from '@/lib/auth-oauth';
import { getLDAPConfig } from '@/lib/auth-ldap';
import { isFeatureEnabled } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const oauthProviders = isFeatureEnabled('oauth') ? getAvailableOAuthProviders() : [];
    const ldapEnabled = isFeatureEnabled('ldap') && getLDAPConfig() !== null;

    return NextResponse.json({
      local: true, // Built-in authentication always available
      ldap: ldapEnabled,
      oauth: oauthProviders,
    });
  } catch (error) {
    console.error('Get auth config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
