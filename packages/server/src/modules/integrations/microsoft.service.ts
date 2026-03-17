import { db } from '../../core/database/connection.js';
import { getIntegrationSettings } from './integration.settings.js';
import { logger } from '../../core/logger.js';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const AUTH_BASE = 'https://login.microsoftonline.com';

export async function getAuthUrl(userId: string) {
  const settings = await getIntegrationSettings('microsoft_365');
  if (!settings || !settings.is_enabled || !settings.client_id) {
    throw new Error('Microsoft 365 integration is not configured');
  }

  const scopes = ['Mail.Read', 'Mail.Send', 'Calendars.Read', 'User.Read', 'offline_access'].join(' ');
  const tenant = settings.tenant_id || 'common';
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64url');

  const params = new URLSearchParams({
    client_id: settings.client_id,
    response_type: 'code',
    redirect_uri: settings.redirect_uri || '',
    scope: scopes,
    response_mode: 'query',
    state,
  });

  return `${AUTH_BASE}/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function handleCallback(code: string, state: string) {
  const settings = await getIntegrationSettings('microsoft_365');
  if (!settings) throw new Error('Microsoft 365 integration not configured');

  const { userId } = JSON.parse(Buffer.from(state, 'base64url').toString());
  const tenant = settings.tenant_id || 'common';

  const tokenResponse = await fetch(`${AUTH_BASE}/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      code,
      redirect_uri: settings.redirect_uri || '',
      grant_type: 'authorization_code',
      scope: 'Mail.Read Mail.Send Calendars.Read User.Read offline_access',
    }),
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    logger.error({ err }, 'M365 token exchange failed');
    throw new Error('Failed to exchange authorization code');
  }

  const tokens = await tokenResponse.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  };

  // Store or update the connection
  const existing = await db('integration_connections')
    .where({ user_id: userId, provider: 'microsoft_365' }).first();

  const connectionData = {
    user_id: userId,
    provider: 'microsoft_365' as const,
    access_token_encrypted: tokens.access_token,
    refresh_token_encrypted: tokens.refresh_token,
    scopes: tokens.scope.split(' '),
    connected_at: new Date(),
    expires_at: new Date(Date.now() + tokens.expires_in * 1000),
  };

  if (existing) {
    await db('integration_connections').where({ id: existing.id }).update(connectionData);
  } else {
    await db('integration_connections').insert(connectionData);
  }

  logger.info({ userId }, 'M365 connection established');
  return { success: true };
}

async function getValidToken(userId: string): Promise<string> {
  const connection = await db('integration_connections')
    .where({ user_id: userId, provider: 'microsoft_365' }).first();

  if (!connection) throw new Error('No Microsoft 365 connection found');

  // Check if token is expired (with 5 min buffer)
  if (connection.expires_at && new Date(connection.expires_at) < new Date(Date.now() + 5 * 60 * 1000)) {
    return refreshToken(userId, connection);
  }

  return connection.access_token_encrypted;
}

async function refreshToken(userId: string, connection: any): Promise<string> {
  const settings = await getIntegrationSettings('microsoft_365');
  if (!settings) throw new Error('M365 settings not found');

  const tenant = settings.tenant_id || 'common';
  const response = await fetch(`${AUTH_BASE}/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      refresh_token: connection.refresh_token_encrypted,
      grant_type: 'refresh_token',
      scope: 'Mail.Read Mail.Send Calendars.Read User.Read offline_access',
    }),
  });

  if (!response.ok) throw new Error('Token refresh failed');
  const tokens = await response.json() as { access_token: string; refresh_token: string; expires_in: number };

  await db('integration_connections').where({ id: connection.id }).update({
    access_token_encrypted: tokens.access_token,
    refresh_token_encrypted: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000),
  });

  return tokens.access_token;
}

export async function getRecentEmails(userId: string, limit = 20) {
  const token = await getValidToken(userId);
  const response = await fetch(
    `${GRAPH_BASE}/me/messages?$top=${limit}&$orderby=receivedDateTime desc&$select=subject,from,receivedDateTime,bodyPreview,isRead`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error('Failed to fetch emails');
  const data = await response.json() as { value: any[] };
  return data.value;
}

export async function getCalendarEvents(userId: string, days = 7) {
  const token = await getValidToken(userId);
  const start = new Date().toISOString();
  const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const response = await fetch(
    `${GRAPH_BASE}/me/calendarview?startDateTime=${start}&endDateTime=${end}&$orderby=start/dateTime&$select=subject,start,end,organizer,attendees`,
    { headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.timezone="UTC"' } },
  );
  if (!response.ok) throw new Error('Failed to fetch calendar events');
  const data = await response.json() as { value: any[] };
  return data.value;
}

export async function getConnectionStatus(userId: string) {
  const connection = await db('integration_connections')
    .where({ user_id: userId, provider: 'microsoft_365' }).first();
  if (!connection) return { connected: false };
  return {
    connected: true,
    connected_at: connection.connected_at,
    expires_at: connection.expires_at,
    scopes: connection.scopes,
  };
}

export async function disconnectUser(userId: string) {
  await db('integration_connections').where({ user_id: userId, provider: 'microsoft_365' }).del();
}
