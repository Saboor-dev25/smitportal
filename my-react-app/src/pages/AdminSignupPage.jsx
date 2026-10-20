import { useEffect, useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Input from '../components/Input.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { apiErrorMessage, apiRequest } from '../services/api.js'

export default function AdminSignupPage() {
  const [form, setForm] = useState({ name: '', username: '', password: '' })
  const [setupAvailable, setSetupAvailable] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    apiRequest('/auth/admin/setup-status')
      .then((result) => setSetupAvailable(result.data.setupAvailable))
      .catch((requestError) => setError(apiErrorMessage(requestError)))
  }, [])

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await apiRequest('/auth/admin/signup', { method: 'POST', body: form })
      window.location.assign('/admin/courses')
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
      if (requestError.status === 409) setSetupAvailable(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="form-card">
      <span className="eyebrow">INITIAL ADMIN SETUP</span>
      <h1>Create administrator account</h1>
      {setupAvailable === null && !error ? <LoadingSpinner label="Checking setup availability" /> : null}
      {setupAvailable === false ? (
        <>
          <p className="muted">An administrator account is already set up. Ask an existing administrator to add another account.</p>
          <a className="text-link" href="/admin/login">Go to administrator login</a>
        </>
      ) : setupAvailable && (
        <>
          <p className="muted">This one-time signup closes after the first administrator account is created.</p>
          <form className="form-stack" onSubmit={submit}>
            <Input label="Full name" name="name" autoComplete="name" maxLength="100" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <Input label="Username" name="username" autoComplete="username" minLength="3" maxLength="40" required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
            <Input label="Password" name="password" type="password" autoComplete="new-password" minLength="12" maxLength="128" required hint="Use 12–128 characters." value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <ErrorMessage>{error}</ErrorMessage>
            <Button type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create first administrator'}</Button>
          </form>
        </>
      )}
      {setupAvailable === null && error && <ErrorMessage>{error}</ErrorMessage>}
      <p className="form-footer"><a className="text-link" href="/admin/login">Administrator login</a></p>
    </Card>
  )
}
