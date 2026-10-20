import { useEffect, useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Input from '../components/Input.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { apiErrorMessage, apiRequest } from '../services/api.js'

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

export default function CoursesPage({ user }) {
  const [courses, setCourses] = useState([])
  const [fields, setFields] = useState([])
  const [values, setValues] = useState({})
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    Promise.all([apiRequest('/courses'), apiRequest('/applications/fields')])
      .then(([courseResult, fieldResult]) => {
        setCourses(courseResult.data.courses)
        setFields(fieldResult.data.fields)
      })
      .catch((requestError) => setError(apiErrorMessage(requestError)))
      .finally(() => setLoading(false))
  }, [])

  function apply(course) {
    setNotice('')
    setError('')
    if (user?.role !== 'student') {
      setNotice('Sign in or create a student account before applying.')
      return
    }
    setSelected(course)
    setValues(Object.fromEntries(fields.map((field) => [field.key, ''])))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await apiRequest('/applications', {
        method: 'POST',
        body: { courseId: selected.id, fields: values },
      })
      setNotice(result.message)
      setSelected(null)
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">LEARN · BUILD · GROW</span>
          <h1>New courses</h1>
          <p className="muted">Explore current programs and apply while admissions are open.</p>
        </div>
        {user?.role === 'admin' && <a className="text-link" href="/admin/courses">Manage courses ↗</a>}
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {notice && <p className="success-message" role="status">{notice} {user?.role !== 'student' && <> <a className="text-link" href="/student/login">Student login</a> · <a className="text-link" href="/student/signup">Sign up</a></>}</p>}
      {loading ? <LoadingSpinner label="Loading courses" /> : courses.length === 0 ? (
        <Card className="empty-state"><h2>Course list is being prepared</h2><p className="muted">Please check back soon for new admissions.</p></Card>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <Card className="course-card" key={course.id}>
              <div className="course-card__top"><StatusBadge status={course.admissionStatus} /><span className="mono">{formatDate(course.createdAt)}</span></div>
              <h2>{course.name}</h2>
              <p className="muted">{course.admissionStatus === 'Open' ? 'Applications are currently being accepted.' : 'Admissions for this course are closed.'}</p>
              <Button type="button" disabled={course.admissionStatus !== 'Open'} onClick={() => apply(course)}>
                {course.admissionStatus === 'Open' ? 'Apply now' : 'Applications closed'}
              </Button>
            </Card>
          ))}
        </div>
      )}
      {selected && (
        <Modal title={`Apply · ${selected.name}`} onClose={() => setSelected(null)}>
          <p className="muted">Applying as {user?.name} · {user?.rollNumber}</p>
          <form className="form-stack" onSubmit={submit}>
            {fields.map((field) => field.type === 'textarea' ? (
              <div className="field" key={field.key}>
                <label className="field__label" htmlFor={`application-${field.key}`}>{field.label}{field.required ? ' *' : ''}</label>
                <textarea id={`application-${field.key}`} className="field__input" rows="4" maxLength={field.maxLength} required={field.required} value={values[field.key] || ''} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} />
              </div>
            ) : (
              <Input key={field.key} label={field.label} name={field.key} type={field.type} maxLength={field.maxLength} required={field.required} value={values[field.key] || ''} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} />
            ))}
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <div className="modal__actions">
              <Button type="button" variant="quiet" onClick={() => setSelected(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit application'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
