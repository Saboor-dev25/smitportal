import { useEffect, useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Input from '../components/Input.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { apiErrorMessage, apiRequest } from '../services/api.js'

const initialForm = { reason: '', startDate: '', endDate: '', attachment: null }

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function StudentLeavesPage() {
  const [leaves, setLeaves] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadLeaves() {
    const result = await apiRequest('/leaves/mine')
    setLeaves(result.data.leaves)
  }

  useEffect(() => {
    let active = true
    apiRequest('/leaves/mine')
      .then((result) => { if (active) setLeaves(result.data.leaves) })
      .catch((requestError) => { if (active) setError(apiErrorMessage(requestError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const attachment = form.attachment ? {
        name: form.attachment.name,
        mimeType: form.attachment.type,
        data: await toBase64(form.attachment),
      } : undefined
      await apiRequest('/leaves', {
        method: 'POST',
        body: {
          reason: form.reason,
          startDate: form.startDate,
          endDate: form.endDate,
          ...(attachment ? { attachment } : {}),
        },
      })
      setForm(initialForm)
      document.getElementById('attachment').value = ''
      setNotice('Your leave request was submitted and is pending review.')
      await loadLeaves()
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content-stack">
      <div className="page-heading"><div><span className="eyebrow">STUDENT SERVICES</span><h1>Leave requests</h1><p className="muted">Submit a request and track the administrator’s decision.</p></div></div>
      <Card className="form-card leave-form-card">
        <h2>Request leave</h2>
        <form className="form-stack" onSubmit={submit}>
          <div className="field"><label className="field__label" htmlFor="leave-reason">Reason</label><textarea id="leave-reason" className="field__input" rows="4" maxLength="1000" required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></div>
          <div className="date-grid">
            <Input label="Start date" name="startDate" type="date" required value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            <Input label="End date" name="endDate" type="date" required value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
          </div>
          <Input label="Supporting picture (optional)" name="attachment" type="file" accept="image/jpeg,image/png,image/webp" hint="JPEG, PNG or WebP · maximum 2 MB" onChange={(event) => {
            const file = event.target.files?.[0]
            if (file && file.size > 2 * 1024 * 1024) {
              setError('Image must be no larger than 2 MB')
              event.target.value = ''
              return
            }
            setError('')
            setForm({ ...form, attachment: file || null })
          }} />
          {notice && <p className="success-message" role="status">{notice}</p>}
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit leave request'}</Button>
        </form>
      </Card>
      <div className="page-heading"><div><h2>Leave history</h2><p className="muted">Your requests and their latest status.</p></div></div>
      {error && !notice && <ErrorMessage>{error}</ErrorMessage>}
      {loading ? <p className="muted">Loading leave history…</p> : leaves.length === 0 ? (
        <Card className="empty-state"><p className="muted">You haven’t submitted any leave requests yet.</p></Card>
      ) : (
        <div className="leave-list">
          {leaves.map((leave) => (
            <Card className="leave-card" key={leave.id}>
              <div className="leave-card__top"><StatusBadge status={leave.status} /><span className="mono">Submitted {new Date(leave.createdAt).toLocaleDateString()}</span></div>
              <p><strong>{new Date(`${leave.startDate}T00:00:00`).toLocaleDateString()} – {new Date(`${leave.endDate}T00:00:00`).toLocaleDateString()}</strong></p>
              <p className="muted">{leave.reason}</p>
              {leave.decisionNote && <p className="decision-note"><strong>Administrator note:</strong> {leave.decisionNote}</p>}
              {leave.decidedAt && <p className="mono">Decision recorded {new Date(leave.decidedAt).toLocaleString()}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
