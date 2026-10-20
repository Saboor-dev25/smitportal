import { useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Input from '../components/Input.jsx'
import { apiErrorMessage, apiRequest } from '../services/api.js'

export default function AddAdminPage() {
  const [form, setForm] = useState({ name: '', username: '', password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setError('')
    try {
      const response = await apiRequest('/auth/admin/users', { method: 'POST', body: form })
      setMessage(`${response.data.user.name} was added as an administrator.`)
      setForm({ name: '', username: '', password: '' })
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="form-card">
      <span className="eyebrow">ADMINISTRATION</span>
      <h1>Add administrator</h1>
      <p className="muted">New administrators can manage courses and create other administrator accounts.</p>
      <form className="form-stack" onSubmit={submit}>
        <Input label="Full name" name="name" autoComplete="name" maxLength="100" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Input label="Username" name="username" autoComplete="username" minLength="3" maxLength="40" required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        <Input label="Temporary password" name="password" type="password" autoComplete="new-password" minLength="12" maxLength="128" required hint="Use 12–128 characters." value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        {message && <p className="success-message" role="status">{message}</p>}
        <ErrorMessage>{error}</ErrorMessage>
        <Button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add administrator'}</Button>
      </form>
    </Card>
  )
}
