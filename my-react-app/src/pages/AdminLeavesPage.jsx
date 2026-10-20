import { useEffect, useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { apiErrorMessage, apiRequest } from '../services/api.js'

const filters = ['All', 'Pending', 'Approved', 'Rejected']

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState([])
  const [filter, setFilter] = useState('Pending')
  const [selected, setSelected] = useState(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function fetchLeaves() {
      try {
        const query = filter === 'All' ? '' : `?status=${filter}`
        const result = await apiRequest(`/leaves${query}`)
        if (active) {
          setLeaves(result.data.leaves)
          setError('')
        }
      } catch (requestError) {
        if (active) setError(apiErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchLeaves()
    return () => { active = false }
  }, [filter])

  async function openDetails(leave) {
    setError('')
    try {
      const result = await apiRequest(`/leaves/${encodeURIComponent(leave.id)}`)
      setSelected(result.data.leave)
      setDecisionNote(result.data.leave.decisionNote || '')
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    }
  }

  async function decide(status) {
    setSaving(true)
    setError('')
    try {
      await apiRequest(`/leaves/${encodeURIComponent(selected.id)}`, {
        method: 'PATCH',
        body: { status, decisionNote },
      })
      setSelected(null)
      const query = filter === 'All' ? '' : `?status=${filter}`
      const result = await apiRequest(`/leaves${query}`)
      setLeaves(result.data.leaves)
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content-stack">
      <div className="page-heading"><div><span className="eyebrow">ADMINISTRATION</span><h1>Leave management</h1><p className="muted">Review student requests and record a clear decision.</p></div></div>
      <div className="filter-tabs" role="group" aria-label="Filter leave requests">
        {filters.map((status) => <Button key={status} type="button" variant={filter === status ? 'primary' : 'quiet'} onClick={() => setFilter(status)}>{status}</Button>)}
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading ? <LoadingSpinner label="Loading leave requests" /> : leaves.length === 0 ? (
        <Card className="empty-state"><h2>No {filter === 'All' ? '' : filter.toLowerCase()} requests</h2><p className="muted">Student leave requests will appear here.</p></Card>
      ) : (
        <Card className="table-card"><div className="table-scroll"><table><thead><tr><th>Student</th><th>Dates</th><th>Submitted</th><th>Status</th><th>Decision</th></tr></thead><tbody>
          {leaves.map((leave) => <tr key={leave.id}>
            <td><strong>{leave.student.name}</strong><div className="mono">{leave.student.rollNumber}</div></td>
            <td>{new Date(`${leave.startDate}T00:00:00`).toLocaleDateString()} – {new Date(`${leave.endDate}T00:00:00`).toLocaleDateString()}</td>
            <td>{new Date(leave.createdAt).toLocaleDateString()}</td>
            <td><StatusBadge status={leave.status} /></td>
            <td><Button type="button" variant="quiet" onClick={() => openDetails(leave)}>Review</Button></td>
          </tr>)}
        </tbody></table></div></Card>
      )}
      {selected && (
        <Modal title="Leave request details" onClose={() => setSelected(null)}>
          <div className="detail-stack">
            <div className="leave-card__top"><div><strong>{selected.student.name}</strong><div className="mono">{selected.student.rollNumber}</div></div><StatusBadge status={selected.status} /></div>
            <p><strong>Dates:</strong> {new Date(`${selected.startDate}T00:00:00`).toLocaleDateString()} – {new Date(`${selected.endDate}T00:00:00`).toLocaleDateString()}</p>
            <p><strong>Reason:</strong><br />{selected.reason}</p>
            {selected.attachment?.data && <a className="text-link" href={`data:${selected.attachment.mimeType};base64,${selected.attachment.data}`} download={selected.attachment.name}>View attached picture ↗</a>}
            <div className="field"><label className="field__label" htmlFor="decision-note">Decision note (optional)</label><textarea id="decision-note" className="field__input" maxLength="500" rows="3" value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} /></div>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {selected.status === 'Pending' ? <div className="modal__actions"><Button type="button" variant="secondary" disabled={saving} onClick={() => decide('Rejected')}>Reject</Button><Button type="button" disabled={saving} onClick={() => decide('Approved')}>Approve</Button></div> : <p className="muted">Decision recorded {selected.decidedAt ? new Date(selected.decidedAt).toLocaleString() : ''}</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}
