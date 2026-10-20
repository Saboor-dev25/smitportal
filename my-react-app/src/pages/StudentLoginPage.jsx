import { useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Input from '../components/Input.jsx'
import { apiErrorMessage, apiRequest } from '../services/api.js'

export default function StudentLoginPage() {
  const [form, setForm] = useState({ rollNumber: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await apiRequest('/auth/student/login', { method: 'POST', body: form })
      window.location.assign('/')
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="form-card">
      <span className="eyebrow">STUDENT ACCESS</span>
      <h1>Student login</h1>
      <form className="form-stack" onSubmit={submit}>
        <Input label="Roll number" name="rollNumber" autoComplete="username" required value={form.rollNumber} onChange={(event) => setForm({ ...form, rollNumber: event.target.value })} />
        <Input label="Password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <ErrorMessage>{error}</ErrorMessage>
        <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <p className="form-footer"><a className="text-link" href="/student/signup">Create a student account</a></p>
    </Card>
  )
}
