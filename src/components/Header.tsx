import { Link } from '@tanstack/react-router'
import { useAuth } from '../authkit/hooks/useAuth'

interface HeaderProps {
  signInUrl?: string;
}

export default function Header({ signInUrl = '/api/auth/login' }: HeaderProps = {}) {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="p-2 flex gap-2 bg-white text-black justify-between border-b border-gray-200">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link to="/">Home</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/start/server-funcs">Start - Server Functions</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/start/api-request">Start - API Request</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/tanstack-query">TanStack Query</Link>
        </div>

        {isAuthenticated && (
          <div className="px-2 font-bold">
            <Link to="/profile">Profile</Link>
          </div>
        )}
      </nav>

      {/* Authentication Section */}
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Welcome, {user?.name || user?.firstName || user?.preferredUsername || user?.email}!
            </span>
            <Link
              to="/logout"
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Sign Out
            </Link>
          </div>
        ) : (
          <a
            href={signInUrl}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Sign In
          </a>
        )}
      </div>
    </header>
  )
}
