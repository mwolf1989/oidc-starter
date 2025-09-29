import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '../authkit/hooks/useAuth'
import SignInButton from '../components/SignInButton'
import logo from '../logo.svg'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        <img
          src={logo}
          className="h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
          alt="logo"
        />

        {/* Authentication Status */}
        <div className="mb-8">
          {isAuthenticated ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-green-400">
                Welcome back, {user?.name || user?.firstName || user?.preferredUsername || user?.email}!
              </h2>
              <p className="text-lg">
                You are successfully authenticated with OIDC.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/profile"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                OIDC Starter Application
              </h2>
              <p className="text-lg">
                Please sign in to access your profile and protected features.
              </p>
              <div className="flex justify-center">
                <SignInButton large={true} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <p>
            Edit <code>src/routes/index.tsx</code> and save to reload.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              className="text-[#61dafb] hover:underline"
              href="https://reactjs.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn React
            </a>
            <a
              className="text-[#61dafb] hover:underline"
              href="https://tanstack.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn TanStack
            </a>
          </div>
        </div>
      </header>
    </div>
  )
}
