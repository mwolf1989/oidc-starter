import { createFileRoute } from '@tanstack/react-router'
import { signOut } from '../authkit/serverFunctions'

export const Route = createFileRoute('/logout')({
  loader: async () => {
    // Perform logout and redirect
    await signOut({ data: '/' });
    return {};
  },
  component: LogoutPage,
})

function LogoutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Signing Out...</h1>
        <p className="text-gray-600">Please wait while we sign you out.</p>
      </div>
    </div>
  )
}
