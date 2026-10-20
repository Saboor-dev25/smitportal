import { useEffect, useState } from 'react'
import Card from '../components/Card.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { apiErrorMessage, apiRequest } from '../services/api.js'

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    apiRequest('/applications/mine')
      .then((result) => { if (active) setApplications(result.data.applications) })
      .catch((requestError) => { if (active) setError(apiErrorMessage(requestError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <div className="content-stack">
      <div className="page-heading"><div><span className="eyebrow">ADMISSIONS</span><h1>My applications</h1><p className="muted">Your course application submissions.</p></div><a className="text-link" href="/courses">Browse courses ↗</a></div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading ? <LoadingSpinner label="Loading applications" /> : applications.length === 0 ? (
        <Card className="empty-state"><h2>No applications yet</h2><p className="muted">Open courses will appear on the new courses page.</p><a className="text-link" href="/courses">Explore courses ↗</a></Card>
      ) : applications.map((application) => (
        <Card className="application-card" key={application.id}>
          <div className="leave-card__top"><div><h2>{application.courseName}</h2><span className="mono">Applied {new Date(application.createdAt).toLocaleString()}</span></div><StatusBadge status={application.status} /></div>
          <div className="application-fields">{Object.entries(application.fields).filter(([, value]) => value).map(([key, value]) => <p key={key}><strong>{key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}:</strong> {value}</p>)}</div>
        </Card>
      ))}
    </div>
  )
}
