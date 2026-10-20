import { useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Input from '../components/Input.jsx'
import { apiErrorMessage, apiRequest } from '../services/api.js'

export default function AdminPasswordChangePage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      const response = await apiRequest('/auth/admin/password', { method: 'POST', body: form })
      setMessage(response.message)
      setForm({ currentPassword: '', newPassword: '' })
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    }
  }

  return (
    <Card className="form-card">
      <span className="eyebrow">ACCOUNT SECURITY</span>
      <h1>Change password</h1>
      <form className="form-stack" onSubmit={submit}>
        <Input label="Current password" name="currentPassword" type="password" autoComplete="current-password" required value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} />
        <Input label="New password" name="newPassword" type="password" autoComplete="new-password" minLength="12" required hint="Use 12–128 characters." value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} />
        {message && <p className="success-message" role="status">{message}</p>}
        <ErrorMessage>{error}</ErrorMessage>
        <Button type="submit">Update password</Button>
      </form>
    </Card>
  )
}
