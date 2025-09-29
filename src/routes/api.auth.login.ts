import { createFileRoute } from '@tanstack/react-router';
import { beginAuth } from '../authkit/ssr/oidc-client';
import { sealData } from 'iron-session';
import { getConfig } from '../authkit/ssr/config';
import { setCookie } from '@tanstack/react-start/server';

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const returnTo = url.searchParams.get('returnTo') || '/';

        // Begin OIDC auth flow
        const authData = await beginAuth({ returnPathname: returnTo });

        // Store PKCE data in encrypted cookie for callback
        const cookiePassword = getConfig('cookiePassword');
        const stateData = {
          codeVerifier: authData.codeVerifier,
          state: authData.state,
          returnTo,
        };
        const encryptedState = await sealData(stateData, { password: cookiePassword });

        // Persist the encrypted state on the response using Start's cookie helpers
        const secure = getConfig('redirectUri').startsWith('https:');
        const cookieOptions: Parameters<typeof setCookie>[2] = {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 600, // 10 minutes
          secure,
        };

        const domain = getConfig('cookieDomain');
        if (domain) {
          cookieOptions.domain = domain;
        }

        setCookie('oidc-state', encryptedState, cookieOptions);

        // Redirect to authorization URL
        return new Response(null, {
          status: 302,
          headers: {
            'Location': authData.url,
          },
        });
      },
    },
  },
});
