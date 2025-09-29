import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/auth/test-callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        console.log('Test Callback - URL:', url.toString());
        console.log('Test Callback - Code:', code ? code.substring(0, 20) + '...' : 'MISSING');
        console.log('Test Callback - State:', state ? 'PRESENT' : 'MISSING');
        console.log('Test Callback - Error:', error);

        if (error) {
          return new Response(`OAuth Error: ${error}`, { status: 400 });
        }

        if (!code) {
          return new Response('Missing authorization code', { status: 400 });
        }

        // Just return success for now
        return new Response(`
          <html>
            <body>
              <h1>Callback Test Successful!</h1>
              <p>Authorization code received: ${code.substring(0, 20)}...</p>
              <p>State: ${state ? 'Present' : 'Missing'}</p>
              <a href="/">Back to Home</a>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      },
    },
  },
});
