import { useEffect, useState } from 'react'
import Button from './components/Button.jsx'
import Card from './components/Card.jsx'
import ErrorMessage from './components/ErrorMessage.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AddAdminPage from './pages/AddAdminPage.jsx'
import AddStudentRecordPage from './pages/AddStudentRecordPage.jsx'
import AdminCoursesPage from './pages/AdminCoursesPage.jsx'
import AdminLoginPage from './pages/AdminLoginPage.jsx'
import AdminPasswordChangePage from './pages/AdminPasswordChangePage.jsx'
import AdminSignupPage from './pages/AdminSignupPage.jsx'
import StudentLoginPage from './pages/StudentLoginPage.jsx'
import StudentSignupPage from './pages/StudentSignupPage.jsx'
import CoursesPage from './pages/CoursesPage.jsx'
import StudentLeavesPage from './pages/StudentLeavesPage.jsx'
import AdminLeavesPage from './pages/AdminLeavesPage.jsx'
import StudentApplicationsPage from './pages/StudentApplicationsPage.jsx'
import { apiErrorMessage, apiRequest } from './services/api.js'

function HomePage({ user }) {
  const facebookPageUrl = import.meta.env.VITE_FACEBOOK_PAGE_URL
    || 'https://www.facebook.com/SaylaniWelfareInternationalTrust/'
  const facebookEmbedUrl = facebookPageUrl
    ? `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(facebookPageUrl)}&tabs=timeline&width=500&height=560&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true`
    : ''

  return (
    <div className="content-stack homepage">
      <Card className="welcome-card">
        <span className="eyebrow">SAYLANI MASS IT TRAINING · STUDENT PORTAL</span>
        <h1>{user ? `Welcome, ${user.name}` : 'Build your future in tech.'}</h1>
        <p className="muted">Explore practical technology programs, apply to new courses, and manage your student services in one place.</p>
        <div className="home-links">
          {user?.role === 'admin' ? <>
            <a className="home-link" href="/admin/courses">Manage courses <span>↗</span></a>
            <a className="home-link" href="/admin/leaves">Review leave requests <span>↗</span></a>
            <a className="home-link" href="/admin/admins/new">Add administrator <span>↗</span></a>
            <a className="home-link" href="/admin/students/new">Manage roster <span>↗</span></a>
          </> : user?.role === 'student' ? <>
            <a className="home-link" href="/student/leaves">Leave requests <span>↗</span></a>
            <a className="home-link" href="/applications">My applications <span>↗</span></a>
          </> : <>
            <a className="home-link" href="/student/login">Student login <span>↗</span></a>
            <a className="home-link" href="/student/signup">Student sign up <span>↗</span></a>
          </>}
          <a className="home-link home-link--primary" href="/courses">New courses <span>↗</span></a>
        </div>
      </Card>
      <section className="social-section">
        <div><span className="eyebrow">FROM OUR COMMUNITY</span><h2>Latest updates</h2><p className="muted">News and announcements from Saylani Welfare International Trust.</p></div>
        <div className="facebook-frame">
          {facebookEmbedUrl ? <iframe title="Saylani official Facebook page posts" src={facebookEmbedUrl} width="500" height="560" style={{ border: 0, width: '100%', maxWidth: '500px' }} scrolling="no" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" /> : <div className="facebook-fallback"><span className="facebook-mark">f</span><h3>Saylani on Facebook</h3><p className="muted">The live posts feed is not configured in this deployment.</p><a className="text-link" href="https://www.facebook.com/SaylaniWelfareInternationalTrust/" target="_blank" rel="noreferrer">Visit the official Facebook page ↗</a></div>}
          {facebookEmbedUrl && <a className="text-link facebook-direct" href={facebookPageUrl} target="_blank" rel="noreferrer">If posts do not load, open the Facebook page ↗</a>}
        </div>
      </section>
    </div>
  )
}

function NotFoundPage() {
  return <Card className="welcome-card"><h1>Page not found</h1><a className="text-link" href="/">Return to home</a></Card>
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const path = window.location.pathname

  useEffect(() => {
    apiRequest('/auth/session')
      .then((result) => setUser(result.data.user))
      .catch((error) => setSessionError(apiErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  async function signOut() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.assign('/')
    } catch (error) {
      setSessionError(apiErrorMessage(error))
    }
  }

  let page
  if (path === '/') page = <HomePage user={user} />
  else if (path === '/admin/login') page = <AdminLoginPage />
  else if (path === '/admin/signup') page = <AdminSignupPage />
  else if (path === '/student/login') page = <StudentLoginPage />
  else if (path === '/student/signup') page = <StudentSignupPage />
  else if (path === '/courses') page = <CoursesPage user={user} />
  else if (path === '/applications') page = <ProtectedRoute user={user} loading={loading} role="student"><StudentApplicationsPage /></ProtectedRoute>
  else if (path === '/student/leaves') page = <ProtectedRoute user={user} loading={loading} role="student"><StudentLeavesPage /></ProtectedRoute>
  else if (path === '/admin/leaves') page = <ProtectedRoute user={user} loading={loading}><AdminLeavesPage /></ProtectedRoute>
  else if (path === '/admin/courses') {
    page = <ProtectedRoute user={user} loading={loading}><AdminCoursesPage /></ProtectedRoute>
  } else if (path === '/admin/admins/new') {
    page = <ProtectedRoute user={user} loading={loading}><AddAdminPage /></ProtectedRoute>
  } else if (path === '/admin/students/new') {
    page = <ProtectedRoute user={user} loading={loading}><AddStudentRecordPage /></ProtectedRoute>
  } else if (path === '/admin/password') {
    page = <ProtectedRoute user={user} loading={loading}><AdminPasswordChangePage /></ProtectedRoute>
  } else page = <NotFoundPage />

  return (
    <div className="portal-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="SMIT Portal home"><span className="brand-mark">S</span><span>SMIT<span className="brand-accent">PORTAL</span></span></a>
        <nav className="topbar__nav" aria-label="Main navigation">
          <a href="/courses">Courses</a>
          {user?.role === 'admin' ? (
            <>
              <a href="/admin/admins/new">Admins</a>
              <a href="/admin/students/new">Roster</a>
              <a href="/admin/leaves">Leaves</a>
              <a href="/admin/password">Password</a>
              <Button variant="quiet" type="button" onClick={signOut}>Sign out</Button>
            </>
          ) : user?.role === 'student' ? (
            <><a href="/student/leaves">Leaves</a><a href="/applications">Applications</a><Button variant="quiet" type="button" onClick={signOut}>Sign out</Button></>
          ) : (
            <><a href="/student/login">Student login</a><a href="/admin/login">Admin login</a></>
          )}
        </nav>
      </header>
      <main className="app-content">
        {sessionError && <ErrorMessage>{sessionError}</ErrorMessage>}
        {loading && path !== '/admin/login' && path !== '/student/login' && path !== '/student/signup'
          ? <LoadingSpinner label="Loading your session" />
          : page}
      </main>
      <footer className="site-footer"><span>SMIT Portal</span><span>SECURE ACCESS · CYBERPUNK THEME</span></footer>
    </div>
  )
}
