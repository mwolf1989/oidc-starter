import { createServerFn } from '@tanstack/react-start';
import { deleteCookie } from '@tanstack/react-start/server';
import { GetAuthURLOptions, NoUserInfo, UserInfo } from './ssr/interfaces';
import { getConfig } from './ssr/config';
import { terminateSession, withAuth, getAuthorizationUrl as getOIDCAuthUrl } from './ssr/session';

export const getAuthorizationUrl = createServerFn({ method: 'GET' })
  .inputValidator((options?: GetAuthURLOptions) => options)
  .handler(async ({ data: options = {} }) => {
    return await getOIDCAuthUrl(options);
  });

export const getSignInUrl = createServerFn({ method: 'GET' })
  .inputValidator((data?: string) => data)
  .handler(async ({ data: returnPathname }) => {
    return await getOIDCAuthUrl({ returnPathname, screenHint: 'sign-in' });
  });

export const getSignUpUrl = createServerFn({ method: 'GET' })
  .inputValidator((data?: string) => data)
  .handler(async ({ data: returnPathname }) => {
    return await getOIDCAuthUrl({ returnPathname, screenHint: 'sign-up' });
  });

export const signOut = createServerFn({ method: 'POST' })
  .inputValidator((data?: string) => data)
  .handler(async ({ data: returnTo }) => {
    const cookieName = getConfig('cookieName') || 'oidc-session';
    deleteCookie(cookieName);
    await terminateSession({ returnTo });
  });

export const getAuth = createServerFn({ method: 'GET' }).handler(async (): Promise<UserInfo | NoUserInfo> => {
  const auth = await withAuth();
  return auth;
});


