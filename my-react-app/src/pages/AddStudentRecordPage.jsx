import { useState } from 'react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Input from '../components/Input.jsx'
import { apiErrorMessage, apiRequest } from '../services/api.js'

export default function AddStudentRecordPage() {
  const [form, setForm] = useState({ name: '', cnic: '', rollNumber: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [importFile, setImportFile] = useState(null)
  const [importRows, setImportRows] = useState([])
  const [importErrors, setImportErrors] = useState([])
  const [importMessage, setImportMessage] = useState('')
  const [importing, setImporting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      const result = await apiRequest('/auth/admin/students', { method: 'POST', body: form })
      setMessage(`${result.data.student.name} (${result.data.student.rollNumber}) can now sign up.`)
      setForm({ name: '', cnic: '', rollNumber: '' })
    } catch (requestError) {
      setError(apiErrorMessage(requestError))
    }
  }

  async function inspectWorkbook(file) {
    setImportFile(null)
    setImportRows([])
    setImportErrors([])
    setImportMessage('')
    if (!file) return
    if (!/\.xlsx$/i.test(file.name)) {
      setImportErrors([{ row: 'File', message: 'Choose an .xlsx workbook' }])
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setImportErrors([{ row: 'File', message: 'Workbook must be no larger than 5 MB' }])
      return
    }
    try {
      const { default: readXlsxFile } = await import('read-excel-file/browser')
      const worksheets = await readXlsxFile(file)
      const matrix = worksheets[0]?.data
      if (!matrix) throw new Error('Workbook has no worksheets')
      const headers = (matrix.shift() || []).map((value) => String(value).trim().toLowerCase().replace(/[^a-z]/g, ''))
      const columns = {
        name: headers.findIndex((value) => ['name', 'studentname', 'fullname'].includes(value)),
        cnic: headers.findIndex((value) => value === 'cnic'),
        rollNumber: headers.findIndex((value) => ['rollnumber', 'rollno', 'roll'].includes(value)),
      }
      const missing = Object.entries(columns).filter(([, index]) => index < 0).map(([key]) => key)
      if (missing.length) {
        setImportErrors([{ row: 'Header', message: `Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}` }])
        return
      }
      const rows = matrix.map((row, index) => ({
        row: index + 2,
        name: String(row[columns.name] ?? '').trim(),
        cnic: typeof row[columns.cnic] === 'number' ? '' : String(row[columns.cnic] ?? '').trim(),
        numericCnic: typeof row[columns.cnic] === 'number',
        rollNumber: String(row[columns.rollNumber] ?? '').trim(),
      })).filter((row) => row.name || row.cnic || row.rollNumber)
      if (!rows.length) {
        setImportErrors([{ row: 'Workbook', message: 'No student rows were found under the header row' }])
        return
      }
      const errors = []
      const seenCnic = new Set()
      const seenRoll = new Set()
      rows.forEach((row) => {
        const cnic = row.cnic.replace(/\D/g, '')
        const roll = row.rollNumber.toUpperCase()
        const issues = []
        if (!row.name || row.name.length > 100) issues.push('Name is missing or too long')
        if (row.numericCnic) issues.push('Format the CNIC cell as text to preserve all 13 digits')
        else if (!/^\d{5}-?\d{7}-?\d$/.test(row.cnic)) issues.push('CNIC must contain 13 digits (optional standard hyphens)')
        if (seenCnic.has(cnic)) issues.push('Duplicate CNIC in this file')
        if (!roll || roll.length > 32) issues.push('Roll number is missing or too long')
        if (seenRoll.has(roll)) issues.push('Duplicate roll number in this file')
        seenCnic.add(cnic)
        seenRoll.add(roll)
        if (issues.length) errors.push({ row: row.row, message: issues.join('; ') })
      })
      if (rows.length > 500) errors.push({ row: 'Workbook', message: 'Import up to 500 students at a time' })
      if (errors.length) {
        setImportErrors(errors)
        return
      }
      setImportFile(file)
      setImportRows(rows.map((row) => {
        const cleanRow = { ...row }
        delete cleanRow.numericCnic
        return cleanRow
      }))
      setImportMessage(`${rows.length} valid student rows ready to import.`)
    } catch {
      setImportErrors([{ row: 'Workbook', message: 'The workbook could not be read. Check that it is a valid Excel file.' }])
    }
  }

  async function importWorkbook(event) {
    event.preventDefault()
    if (!importFile || !importRows.length) return
    setImporting(true)
    setImportErrors([])
    setImportMessage('')
    try {
      const result = await apiRequest('/auth/admin/students/import', {
        method: 'POST',
        body: { students: importRows },
      })
      setImportMessage(result.message)
      setImportFile(null)
      setImportRows([])
      document.getElementById('student-workbook').value = ''
    } catch (requestError) {
      const rows = requestError.fields?.rows || []
      setImportErrors(rows.length ? rows.map(({ row, errors: issues }) => ({ row, message: Object.values(issues).join('; ') })) : [{ row: 'Import', message: requestError.message }])
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card className="form-card">
      <span className="eyebrow">STUDENT ROSTER</span>
      <h1>Add eligible student</h1>
      <p className="muted">Add a roster record so the student can create an account using the same CNIC and roll number.</p>
      <form className="form-stack" onSubmit={submit}>
        <Input label="Student name" name="name" autoComplete="name" maxLength="100" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Input label="CNIC" name="cnic" inputMode="numeric" placeholder="12345-1234567-1" required value={form.cnic} onChange={(event) => setForm({ ...form, cnic: event.target.value })} />
        <Input label="Roll number" name="rollNumber" maxLength="32" required value={form.rollNumber} onChange={(event) => setForm({ ...form, rollNumber: event.target.value })} />
        {message && <p className="success-message" role="status">{message}</p>}
        <ErrorMessage>{error}</ErrorMessage>
        <Button type="submit">Add to roster</Button>
      </form>
      <hr className="section-divider" />
      <h2>Import student roster</h2>
      <p className="muted">Upload an Excel workbook with <strong>Name</strong>, <strong>CNIC</strong> and <strong>Roll Number</strong> columns. Imports are all-or-nothing.</p>
      <form className="form-stack" onSubmit={importWorkbook}>
        <Input id="student-workbook" label="Excel workbook" name="workbook" type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={(event) => inspectWorkbook(event.target.files?.[0])} />
        {importMessage && <p className="success-message" role="status">{importMessage}</p>}
        {importErrors.length > 0 && <div className="import-errors" role="alert"><strong>Import needs correction</strong><ul>{importErrors.map((item, index) => <li key={`${item.row}-${index}`}>Row {item.row}: {item.message}</li>)}</ul></div>}
        <Button type="submit" disabled={importing || !importFile}>{importing ? 'Importing…' : `Save / Import${importRows.length ? ` (${importRows.length})` : ''}`}</Button>
      </form>
    </Card>
  )
}
