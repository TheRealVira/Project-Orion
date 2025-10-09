import ldap, { Client, SearchEntry } from 'ldapjs';
import { createUser, getUserByEmail, User } from './auth';

export interface LDAPConfig {
  url: string;
  bindDN: string;
  bindPassword: string;
  searchBase: string;
  searchFilter: string; // e.g., "(uid={{username}})" or "(mail={{username}})"
  usernameAttribute?: string; // default: 'uid'
  emailAttribute?: string; // default: 'mail'
  nameAttribute?: string; // default: 'cn'
}

/**
 * Get LDAP configuration from environment variables
 */
export function getLDAPConfig(): LDAPConfig | null {
  const url = process.env.LDAP_URL;
  const bindDN = process.env.LDAP_BIND_DN;
  const bindPassword = process.env.LDAP_BIND_PASSWORD;
  const searchBase = process.env.LDAP_SEARCH_BASE;
  const searchFilter = process.env.LDAP_SEARCH_FILTER || '(uid={{username}})';

  if (!url || !bindDN || !bindPassword || !searchBase) {
    return null;
  }

  return {
    url,
    bindDN,
    bindPassword,
    searchBase,
    searchFilter,
    usernameAttribute: process.env.LDAP_USERNAME_ATTR || 'uid',
    emailAttribute: process.env.LDAP_EMAIL_ATTR || 'mail',
    nameAttribute: process.env.LDAP_NAME_ATTR || 'cn',
  };
}

/**
 * Create and bind LDAP client
 */
function createLDAPClient(config: LDAPConfig): Promise<Client> {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: config.url,
      reconnect: false,
    });

    client.on('error', (err) => {
      reject(err);
    });

    client.bind(config.bindDN, config.bindPassword, (err) => {
      if (err) {
        client.unbind();
        reject(err);
      } else {
        resolve(client);
      }
    });
  });
}

/**
 * Search for user in LDAP
 */
function searchLDAPUser(
  client: Client,
  config: LDAPConfig,
  username: string
): Promise<SearchEntry | null> {
  return new Promise((resolve, reject) => {
    const filter = config.searchFilter.replace('{{username}}', username);

    const opts = {
      filter,
      scope: 'sub' as const,
      attributes: [
        config.usernameAttribute || 'uid',
        config.emailAttribute || 'mail',
        config.nameAttribute || 'cn',
      ],
    };

    client.search(config.searchBase, opts, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      let entry: SearchEntry | null = null;

      res.on('searchEntry', (searchEntry) => {
        if (!entry) {
          entry = searchEntry;
        }
      });

      res.on('error', (error) => {
        reject(error);
      });

      res.on('end', () => {
        resolve(entry);
      });
    });
  });
}

/**
 * Authenticate user with LDAP
 */
export async function authenticateLDAP(username: string, password: string): Promise<User | null> {
  const config = getLDAPConfig();
  if (!config) {
    console.error('LDAP configuration not found');
    return null;
  }

  let adminClient: Client | null = null;
  let userClient: Client | null = null;

  try {
    // Bind with admin credentials to search for user
    adminClient = await createLDAPClient(config);

    // Search for user
    const entry = await searchLDAPUser(adminClient, config, username);
    if (!entry) {
      console.log('LDAP user not found:', username);
      return null;
    }

    // Get user DN and attributes
    const userDN = entry.objectName || '';
    const attributes = entry.attributes.reduce((acc, attr) => {
      acc[attr.type] = attr.values[0];
      return acc;
    }, {} as Record<string, string>);

    const email = attributes[config.emailAttribute || 'mail'];
    const name = attributes[config.nameAttribute || 'cn'];
    const ldapId = attributes[config.usernameAttribute || 'uid'];

    if (!email || !name) {
      console.error('LDAP user missing required attributes');
      return null;
    }

    // Try to authenticate with user credentials
    userClient = ldap.createClient({
      url: config.url,
      reconnect: false,
    });

    await new Promise<void>((resolve, reject) => {
      userClient!.bind(userDN, password, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Authentication successful, find or create user
    let user = getUserByEmail(email);

    if (!user) {
      // Create new user from LDAP with viewer role by default
      user = await createUser({
        email,
        name,
        role: 'viewer', // External LDAP users start as viewers
        authProvider: 'ldap',
        authProviderId: ldapId,
      });
      console.log('Created new LDAP user as viewer:', email);
    } else if (user.authProvider !== 'ldap') {
      console.error('User exists with different auth provider:', email);
      return null;
    }

    return user;
  } catch (error) {
    console.error('LDAP authentication error:', error);
    return null;
  } finally {
    if (adminClient) {
      adminClient.unbind();
    }
    if (userClient) {
      userClient.unbind();
    }
  }
}

/**
 * Test LDAP connection
 */
export async function testLDAPConnection(): Promise<boolean> {
  const config = getLDAPConfig();
  if (!config) {
    return false;
  }

  let client: Client | null = null;

  try {
    client = await createLDAPClient(config);
    return true;
  } catch (error) {
    console.error('LDAP connection test failed:', error);
    return false;
  } finally {
    if (client) {
      client.unbind();
    }
  }
}
