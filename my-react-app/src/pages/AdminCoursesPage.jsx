import { useCallback, useEffect, useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Input from '../components/Input.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { apiErrorMessage, apiRequest } from '../services/api.js'

const emptyForm = { name: '', admissionStatus: 'Open' }

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp))
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const loadCourses = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiRequest('/courses')
      setCourses(result.data.courses)
      setPageError('')
    } catch (error) {
      setPageError(apiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    apiRequest('/courses')
      .then((result) => {
        if (active) {
          setCourses(result.data.courses)
          setPageError('')
        }
      })
      .catch((error) => { if (active) setPageError(apiErrorMessage(error)) })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(course) {
    setEditing(course)
    setForm({ name: course.name, admissionStatus: course.admissionStatus })
    setFormError('')
    setModalOpen(true)
  }

  async function saveCourse(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await apiRequest(`/courses/${encodeURIComponent(editing.id)}`, { method: 'PATCH', body: form })
      } else {
        await apiRequest('/courses', { method: 'POST', body: form })
      }
      setModalOpen(false)
      await loadCourses()
    } catch (error) {
      setFormError(apiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMINISTRATION</span>
          <h1>Course management</h1>
          <p className="muted">Create courses and control their admission status.</p>
        </div>
        <Button type="button" onClick={openAdd}>＋ Add course</Button>
      </div>

      {pageError && <ErrorMessage>{pageError}</ErrorMessage>}
      {loading ? <LoadingSpinner label="Loading courses" /> : (
        <Card className="table-card">
          {courses.length === 0 ? (
            <div className="empty-state">
              <h2>No courses yet</h2>
              <p className="muted">Add the first course to begin managing admissions.</p>
              <Button type="button" variant="secondary" onClick={openAdd}>Add course</Button>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Course</th><th>ID</th><th>Admission</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="course-name">{course.name}</td>
                      <td className="mono">{course.id}</td>
                      <td><StatusBadge status={course.admissionStatus} /></td>
                      <td>{formatDate(course.createdAt)}</td>
                      <td><Button type="button" variant="quiet" onClick={() => openEdit(course)}>Edit</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Edit course' : 'Add course'} onClose={() => setModalOpen(false)}>
          <form className="form-stack" onSubmit={saveCourse}>
            <Input label="Course name" name="name" maxLength="120" required autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <div className="field">
              <label className="field__label" htmlFor="admissionStatus">Admission status</label>
              <select id="admissionStatus" className="field__input" value={form.admissionStatus} onChange={(event) => setForm({ ...form, admissionStatus: event.target.value })}>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            {formError && <ErrorMessage>{formError}</ErrorMessage>}
            <div className="modal__actions">
              <Button type="button" variant="quiet" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create course'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
