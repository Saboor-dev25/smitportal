import { useEffect, useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Input from '../components/Input.jsx'
import { apiErrorMessage, apiRequest } from '../services/api.js'

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [setupAvailable, setSetupAvailable] = useState(false)

  useEffect(() => {
    apiRequest('/auth/admin/setup-status')
      .then((result) => setSetupAvailable(result.data.setupAvailable))
      .catch(() => setSetupAvailable(false))
  }, [])

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await apiRequest('/auth/admin/login', { method: 'POST', body: form })
      window.location.assign('/admin/courses')
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="form-card">
      <span className="eyebrow">ADMIN ACCESS</span>
      <h1>Administrator login</h1>
      <p className="muted">Sign in to manage administrators and course admissions.</p>
      <form className="form-stack" onSubmit={submit}>
        <Input label="Username" name="username" autoComplete="username" required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        <Input label="Password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <ErrorMessage>{error}</ErrorMessage>
        <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <p className="form-footer"><a className="text-link" href="/student/login">Student login</a></p>
      {setupAvailable && <p className="form-footer"><a className="text-link" href="/admin/signup">First time here? Create the initial admin account</a></p>}
    </Card>
  )
}
