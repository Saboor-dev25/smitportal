import { useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Input from '../components/Input.jsx'
import { apiErrorMessage, apiRequest } from '../services/api.js'

export default function StudentSignupPage() {
  const [form, setForm] = useState({ cnic: '', rollNumber: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await apiRequest('/auth/student/signup', { method: 'POST', body: form })
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
      <h1>Create student account</h1>
      <p className="muted">Use the CNIC and roll number on your student record.</p>
      <form className="form-stack" onSubmit={submit}>
        <Input label="CNIC" name="cnic" inputMode="numeric" autoComplete="off" placeholder="12345-1234567-1" required value={form.cnic} onChange={(event) => setForm({ ...form, cnic: event.target.value })} />
        <Input label="Roll number" name="rollNumber" autoComplete="username" required value={form.rollNumber} onChange={(event) => setForm({ ...form, rollNumber: event.target.value })} />
        <Input label="Password" name="password" type="password" autoComplete="new-password" minLength="12" maxLength="128" required hint="Use 12–128 characters." value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <ErrorMessage>{error}</ErrorMessage>
        <Button type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
      </form>
      <p className="form-footer"><a className="text-link" href="/student/login">Already registered? Sign in</a></p>
    </Card>
  )
}
