# OIDC Starter for TanStack Router

A comprehensive OpenID Connect (OIDC) authentication starter template built with TanStack Router, React, and TypeScript. This project provides a complete authentication solution for modern React applications using server-side rendering and secure session management.

## 🚀 Features

- **Complete OIDC Integration**: Full OpenID Connect authentication flow with PKCE support
- **Secure Session Management**: Encrypted session cookies using iron-session
- **Server-Side Rendering**: Built with TanStack Start for optimal performance
- **TypeScript Support**: Full type safety throughout the application
- **Modern React Stack**: TanStack Router, React Query, Tailwind CSS
- **Flexible Configuration**: Environment-based configuration with sensible defaults
- **Developer Experience**: Hot reload, comprehensive logging, and debugging tools

## 📋 Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- An OIDC provider (Keycloak, Auth0, Google, etc.)

## 🛠 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/oidc-starter.git
cd oidc-starter
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy the environment template:
```bash
cp .env.example .env.local
```

4. Configure your environment variables (see Configuration section below)

5. Set up your OIDC provider (see Keycloak Setup section below)

6. Start the development server:
```bash
pnpm dev
```

## 🔐 Keycloak Setup

This section shows how to configure Keycloak as your OIDC provider. You can adapt these steps for other OIDC providers like Auth0, Google, or Azure AD.

### 1. Create a Keycloak Realm

1. **Access Keycloak Admin Console**: Navigate to your Keycloak instance (e.g., `https://your-keycloak.com/admin`)
2. **Create Realm**:
   - Click "Add realm" or the dropdown next to "Master"
   - Enter realm name (e.g., `my-app`)
   - Click "Create"

### 2. Create an OIDC Client

1. **Navigate to Clients**: In your realm, go to "Clients" in the left sidebar
2. **Create Client**:
   - Click "Create"
   - **Client ID**: `oidc-starter-app` (or your preferred ID)
   - **Client Protocol**: `openid-connect`
   - Click "Save"

### 3. Configure Client Settings

In the client settings, configure the following:

#### **Settings Tab**:
- **Access Type**: `confidential` (for server-side apps with client secret)
- **Standard Flow Enabled**: `ON` (Authorization Code Flow)
- **Direct Access Grants Enabled**: `OFF` (recommended for security)
- **Valid Redirect URIs**:
  - `http://localhost:3000/api/auth/callback` (development)
  - `https://your-domain.com/api/auth/callback` (production)
- **Web Origins**:
  - `http://localhost:3000` (development)
  - `https://your-domain.com` (production)

#### **Advanced Settings**:
- **Proof Key for Code Exchange Code Challenge Method**: `S256` (PKCE support)

### 4. Get Client Credentials

1. **Go to Credentials Tab**: In your client configuration
2. **Copy Client Secret**: You'll need this for your environment variables

### 5. Configure User Attributes (Optional)

To get additional user information:

1. **Go to Client Scopes**: In the left sidebar
2. **Select your client's dedicated scope** (e.g., `oidc-starter-app-dedicated`)
3. **Add Mappers**: Click "Add mapper" → "By configuration" → "User Attribute"
   - **Name**: `given_name`
   - **User Attribute**: `firstName`
   - **Token Claim Name**: `given_name`
   - **Claim JSON Type**: `String`
   - **Add to ID token**: `ON`
   - **Add to access token**: `ON`
   - **Add to userinfo**: `ON`

Repeat for other attributes like `family_name` (lastName), `preferred_username`, etc.

### 6. Create Test Users

1. **Go to Users**: In the left sidebar
2. **Add User**:
   - **Username**: `testuser`
   - **Email**: `test@example.com`
   - **First Name**: `Test`
   - **Last Name**: `User`
   - **Email Verified**: `ON`
   - Click "Save"
3. **Set Password**:
   - Go to "Credentials" tab
   - Set password and turn off "Temporary"

### 7. Environment Configuration

Update your `.env.local` with the Keycloak settings:

```env
# Keycloak Configuration
OIDC_ISSUER=https://your-keycloak.com/realms/my-app
OIDC_CLIENT_ID=oidc-starter-app
OIDC_CLIENT_SECRET=your-client-secret-from-credentials-tab
OIDC_REDIRECT_URI=http://localhost:3000/api/auth/callback
OIDC_COOKIE_PASSWORD=your-32-character-cookie-password-here

# Optional: Additional scopes
OIDC_SCOPE=openid profile email
```

### 8. Test the Integration

1. Start your application: `pnpm dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign In with Keycloak"
4. You should be redirected to Keycloak login
5. Sign in with your test user
6. You should be redirected back with authentication

### Common Keycloak Issues

**Invalid Redirect URI**: Ensure your redirect URI exactly matches what's configured in Keycloak, including protocol (http/https) and port.

**CORS Issues**: Make sure "Web Origins" is configured correctly in your Keycloak client.

**Client Secret**: For confidential clients, ensure you're using the correct client secret from the Credentials tab.

**Realm URL**: The issuer URL should include the realm: `https://keycloak.com/realms/your-realm`

## ⚙️ Configuration

Configure your OIDC provider settings in `.env.local`:

```env
# Required: OIDC Provider Configuration
OIDC_ISSUER=https://your-keycloak.com/realms/your-realm
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Required: Session Security
OIDC_COOKIE_PASSWORD=your-32-character-cookie-password-here

# Optional: Additional Settings
OIDC_SCOPE=openid profile email
OIDC_COOKIE_MAX_AGE=34560000
OIDC_COOKIE_NAME=oidc-session
```

### Configuration Options

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OIDC_ISSUER` | ✅ | - | OIDC issuer URL (e.g., Keycloak realm URL) |
| `OIDC_CLIENT_ID` | ✅ | - | OIDC client ID |
| `OIDC_CLIENT_SECRET` | ✅ | - | OIDC client secret |
| `OIDC_REDIRECT_URI` | ✅ | - | Callback URL for authentication |
| `OIDC_COOKIE_PASSWORD` | ✅ | - | Password for encrypting session cookies (min 32 chars) |
| `OIDC_SCOPE` | ❌ | `openid profile email` | OIDC scopes to request |
| `OIDC_COOKIE_MAX_AGE` | ❌ | `34560000` | Session cookie max age in seconds (400 days) |
| `OIDC_COOKIE_NAME` | ❌ | `oidc-session` | Name of the session cookie |

## 📖 Usage

### Basic Authentication Flow

The application provides a complete authentication flow out of the box:

1. **Sign In**: Users click "Sign In" to start the OIDC flow
2. **OIDC Provider**: Users authenticate with your OIDC provider
3. **Callback**: The application handles the callback and creates a session
4. **Protected Routes**: Authenticated users can access protected content

### Using Authentication in Components

```tsx
import { useAuth } from './authkit/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <div>Please sign in to continue</div>;
  }

  return (
    <div>
      Welcome, {user.name || user.email}!
    </div>
  );
}
```

### Server Functions

```tsx
import { getAuth, signOut } from './authkit/serverFunctions';

// Get current user info
const auth = await getAuth();

// Sign out user
await signOut();
```

### Protected Routes

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { getAuth } from '../authkit/serverFunctions';

export const Route = createFileRoute('/protected')({
  loader: async () => {
    const auth = await getAuth();
    if (!auth.user) {
      throw redirect({
        to: '/',
        search: { error: 'Please sign in to access this page' },
      });
    }
    return { auth };
  },
  component: ProtectedPage,
});
```

## 🏗 Architecture

### Project Structure

```
src/
├── authkit/                    # Authentication library
│   ├── index.ts               # Main exports
│   ├── hooks/                 # React hooks
│   │   └── useAuth.ts        # Authentication hook
│   ├── serverFunctions.ts     # Server-side auth functions
│   └── ssr/                   # Server-side rendering utilities
│       ├── config.ts          # Configuration management
│       ├── interfaces.ts      # TypeScript interfaces
│       ├── oidc-client.ts     # OIDC client implementation
│       ├── session.ts         # Session management
│       └── utils.ts           # Utility functions
├── components/                # React components
│   └── SignInButton.tsx      # Authentication UI component
├── routes/                    # Application routes
│   ├── index.tsx             # Home page
│   ├── profile.tsx           # User profile page
│   ├── logout.tsx            # Sign out page
│   └── api.auth.*.ts         # Authentication API routes
└── integrations/             # Third-party integrations
    └── tanstack-query/       # React Query setup
```

### Authentication Flow

1. **Client Request**: User clicks sign-in button
2. **Server Initiation**: `/api/auth/login` creates PKCE challenge and redirects to OIDC provider
3. **OIDC Authentication**: User authenticates with provider
4. **Callback Handling**: `/api/auth/callback` exchanges code for tokens
5. **Session Creation**: Encrypted session stored in cookies
6. **Client Access**: Protected routes check authentication status

## 🔧 API Reference

### Server Functions

#### `getAuth()`
Returns current authentication state.

**Returns**: `Promise<UserInfo | NoUserInfo>`

#### `getAuthorizationUrl(options?)`
Gets the OIDC authorization URL.

**Parameters**:
- `options.returnPathname?`: Path to return to after authentication
- `options.screenHint?`: 'sign-up' | 'sign-in'

#### `signOut(options?)`
Signs out the current user.

**Parameters**:
- `options.returnTo?`: Path to redirect to after sign out

### React Hooks

#### `useAuth()`
Returns authentication state for components.

**Returns**:
```tsx
{
  user: OIDCUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

#### `useIsAuthed()`
Simple boolean hook for authentication status.

**Returns**: `boolean`

### Components

#### `SignInButton`
Authentication UI component with sign-in/sign-out functionality.

**Props**:
- `large?`: boolean - Larger button styling
- `user?`: OIDCUser | null - Override user from hook
- `url?`: string - Custom sign-in URL
- `className?`: string - Additional CSS classes

## 🧪 Development

### Available Scripts

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Linting and formatting
pnpm lint
pnpm format
pnpm check
```

### Testing Authentication

The application includes a test callback endpoint for debugging:

```
GET /api/auth/test-callback
```

This endpoint logs callback parameters without processing authentication.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TanStack Router](https://tanstack.com/router) - Modern routing for React
- [openid-client](https://github.com/panva/node-openid-client) - OIDC client library
- [iron-session](https://github.com/vvo/iron-session) - Secure session management
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📞 Support

If you have questions or need help:

1. Check the [Issues](https://github.com/yourusername/oidc-starter/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

Built with ❤️ using TanStack Router and modern React patterns.
