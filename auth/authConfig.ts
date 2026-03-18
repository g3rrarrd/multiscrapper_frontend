import { Configuration, PopupRequest, LogLevel } from '@azure/msal-browser';

/**
 * Configuration for Microsoft Entra ID (Azure AD) authentication.
 * Replace the placeholders with your actual Azure App Registration values.
 *
 * How to get these values:
 * 1. Go to portal.azure.com → Microsoft Entra ID → App registrations
 * 2. Create a new registration (or use an existing one)
 * 3. Copy the "Application (client) ID" → CLIENT_ID
 * 4. Copy the "Directory (tenant) ID" → TENANT_ID
 * 5. Under "Authentication", add a SPA redirect URI (e.g. http://localhost:3000)
 */

const CLIENT_ID = import.meta.env.VITE_ENTRA_CLIENT_ID ?? 'YOUR_CLIENT_ID';
const TENANT_ID = import.meta.env.VITE_ENTRA_TENANT_ID ?? 'YOUR_TENANT_ID';

export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/consumers`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage', // Use 'localStorage' to persist across tabs
    storeAuthStateInCookie: false,   // Set to true for IE11 / Edge Legacy
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:   console.error('[MSAL]', message); break;
          case LogLevel.Warning: console.warn('[MSAL]', message);  break;
          case LogLevel.Info:    console.info('[MSAL]', message);  break;
          case LogLevel.Verbose: console.debug('[MSAL]', message); break;
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
};

/** Scopes requested at login — openid/profile/email are always included */
export const loginRequest: PopupRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};

/** Scopes for acquiring tokens silently after login */
export const tokenRequest = {
  scopes: ['User.Read'],
};