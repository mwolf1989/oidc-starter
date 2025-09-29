import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'
import { getAuth, getSignInUrl } from '../authkit/serverFunctions'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ location }) => {
    // Skip auth loading for callback routes to avoid conflicts
    if (location.pathname.includes('/api/auth/')) {
      return { user: null };
    }

    try {
      const auth = await getAuth();
      return { user: auth.user };
    } catch (error) {
      console.warn('Root beforeLoad auth check failed:', error);
      return { user: null };
    }
  },
  loader: async ({ context, location }) => {
    // Skip auth loading for callback routes to avoid conflicts
    if (location.pathname.includes('/api/auth/')) {
      return { user: null, signInUrl: '/api/auth/login' };
    }

    const { user } = context;
    try {
      if (user) {
        return { user, signInUrl: null };
      } else {
        const signInUrl = await getSignInUrl({ data: '/' });
        return { user: null, signInUrl };
      }
    } catch (error) {
      console.warn('Root loader auth check failed:', error);
      return { user: null, signInUrl: '/api/auth/login' };
    }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const authState = Route.useLoaderData();

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Header signInUrl={authState.signInUrl || undefined} />
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-left',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
