import { createFileRoute } from '@tanstack/react-router';
import { beginAuth } from '../authkit/ssr/oidc-client';
import { sealData } from 'iron-session';
import { getConfig } from '../authkit/ssr/config';

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

        // Redirect to authorization URL with state cookie
        return new Response(null, {
          status: 302,
          headers: {
            'Location': authData.url,
            'Set-Cookie': `oidc-state=${encryptedState}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`, // 10 minutes
          },
        });
      },
    },
  },
});
