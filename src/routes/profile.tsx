import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAuth } from '../authkit/serverFunctions'

export const Route = createFileRoute('/profile')({
  loader: async () => {
    const auth = await getAuth();
    if (!auth.user) {
      throw redirect({
        to: '/',
        search: {
          error: 'You must be logged in to view your profile',
        },
      });
    }
    return { auth };
  },
  component: ProfilePage,
})

function ProfilePage() {
  const { auth } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">User Profile</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                Personal Information
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">User ID</label>
                  <p className="text-gray-900 font-mono text-sm bg-gray-100 p-2 rounded">
                    {auth.user.id}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{auth.user.email}</p>
                </div>
                
                {auth.user.name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-gray-900">{auth.user.name}</p>
                  </div>
                )}

                {auth.user.firstName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">First Name</label>
                    <p className="text-gray-900">{auth.user.firstName}</p>
                  </div>
                )}

                {auth.user.lastName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Last Name</label>
                    <p className="text-gray-900">{auth.user.lastName}</p>
                  </div>
                )}

                {auth.user.preferredUsername && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Username</label>
                    <p className="text-gray-900">{auth.user.preferredUsername}</p>
                  </div>
                )}
                
                {auth.user.emailVerified !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email Verified</label>
                    <p className={`font-medium ${auth.user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                      {auth.user.emailVerified ? 'Yes' : 'No'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Session Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                Session Information
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Session ID</label>
                  <p className="text-gray-900 font-mono text-sm bg-gray-100 p-2 rounded">
                    {auth.sessionId}
                  </p>
                </div>
                
                {auth.accessToken && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Access Token (Last 10 chars)</label>
                    <p className="text-gray-900 font-mono text-sm bg-gray-100 p-2 rounded">
                      ...{auth.accessToken.slice(-10)}
                    </p>
                  </div>
                )}
                
                {auth.idToken && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">ID Token (Last 10 chars)</label>
                    <p className="text-gray-900 font-mono text-sm bg-gray-100 p-2 rounded">
                      ...{auth.idToken.slice(-10)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Raw User Data */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
              Raw User Data (Debug)
            </h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(auth.user, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
