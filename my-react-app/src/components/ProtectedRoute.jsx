import LoadingSpinner from './LoadingSpinner.jsx'

export default function ProtectedRoute({ user, loading, role = 'admin', children }) {
  if (loading) return <LoadingSpinner label="Checking your session" />
  if (!user || user.role !== role) {
    const loginPath = role === 'student' ? '/student/login' : '/admin/login'
    return (
      <div className="notice-card">
        <h2>Sign in required</h2>
        <p>This page is available to signed-in {role}s.</p>
        <a className="text-link" href={loginPath}>Continue to sign in</a>
      </div>
    )
  }
  return children
}
