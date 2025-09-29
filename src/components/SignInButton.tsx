import { Link } from '@tanstack/react-router';
import { useAuth } from '../authkit/hooks/useAuth';
import type { OIDCUser } from '../authkit/ssr/interfaces';

interface SignInButtonProps {
  large?: boolean;
  user?: OIDCUser | null;
  url?: string;
  className?: string;
}

export default function SignInButton({ 
  large = false, 
  user: propUser, 
  url = '/api/auth/login',
  className = ''
}: SignInButtonProps) {
  // Use hook if user not provided as prop
  const { user: hookUser, isAuthenticated } = useAuth();
  const user = propUser !== undefined ? propUser : hookUser;
  
  const baseButtonClass = `px-3 py-1 text-sm rounded transition-colors ${className}`;
  const sizeClass = large ? 'px-4 py-2 text-base' : 'px-3 py-1 text-sm';
  
  if (user || isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          Welcome, {user?.name || user?.firstName || user?.preferredUsername || user?.email}!
        </span>
        <Link
          to="/logout"
          className={`${baseButtonClass} ${sizeClass} bg-red-500 text-white hover:bg-red-600`}
        >
          Sign Out
        </Link>
      </div>
    );
  }

  return (
    <a
      href={url}
      className={`${baseButtonClass} ${sizeClass} bg-blue-500 text-white hover:bg-blue-600`}
    >
      Sign In{large && ' with Keycloak'}
    </a>
  );
}
