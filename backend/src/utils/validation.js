import { AppError } from './http.js'

const isText = (value) => typeof value === 'string' && value.trim().length > 0

export function validateCredentials(body, { student = false } = {}) {
  const errors = {}
  const identityField = student ? 'rollNumber' : 'username'
  if (!isText(body?.[identityField])) errors[identityField] = 'This field is required'
  if (!isText(body?.password) || body.password.length > 128) errors.password = 'Password is required (up to 128 characters)'
  if (Object.keys(errors).length) throw new AppError(400, 'Please check the submitted fields', errors)
}

export function validateNewPassword(password, field = 'password') {
  if (!isText(password) || password.length < 12 || password.length > 128) {
    throw new AppError(400, 'Please check the submitted fields', {
      [field]: 'Password must be between 12 and 128 characters',
    })
  }
}

export function validateAdminInput(body) {
  const errors = {}
  if (!isText(body?.name) || body.name.trim().length > 100) errors.name = 'Name is required (up to 100 characters)'
  if (!isText(body?.username) || !/^[a-zA-Z0-9._-]{3,40}$/.test(body.username.trim())) {
    errors.username = 'Username must be 3–40 letters, numbers, dots, underscores, or hyphens'
  }
  try {
    validateNewPassword(body?.password)
  } catch (error) {
    errors.password = error.errors?.password
  }
  if (Object.keys(errors).length) throw new AppError(400, 'Please check the submitted fields', errors)
}

export function validateStudentSignup(body) {
  const errors = {}
  if (typeof body?.cnic !== 'string' || !/^\d{5}-?\d{7}-?\d$/.test(body.cnic.trim())) {
    errors.cnic = 'Enter a valid 13-digit CNIC'
  }
  if (!isText(body?.rollNumber) || body.rollNumber.trim().length > 32) errors.rollNumber = 'Enter a valid roll number'
  try {
    validateNewPassword(body?.password)
  } catch (error) {
    errors.password = error.errors?.password
  }
  if (Object.keys(errors).length) throw new AppError(400, 'Please check the submitted fields', errors)
}

export function validateStudentRosterRecord(body) {
  const errors = {}
  if (!isText(body?.name) || body.name.trim().length > 100) errors.name = 'Name is required (up to 100 characters)'
  if (typeof body?.cnic !== 'string' || !/^\d{5}-?\d{7}-?\d$/.test(body.cnic.trim())) {
    errors.cnic = 'Enter a valid 13-digit CNIC'
  }
  if (!isText(body?.rollNumber) || body.rollNumber.trim().length > 32) errors.rollNumber = 'Enter a valid roll number'
  if (Object.keys(errors).length) throw new AppError(400, 'Please check the submitted fields', errors)
}

export function validatePasswordChange(body) {
  const errors = {}
  if (!isText(body?.currentPassword)) errors.currentPassword = 'Current password is required'
  try {
    validateNewPassword(body?.newPassword, 'newPassword')
  } catch (error) {
    errors.newPassword = error.errors?.newPassword
  }
  if (Object.keys(errors).length) throw new AppError(400, 'Please check the submitted fields', errors)
}

export function validateCourse(body, { partial = false } = {}) {
  const errors = {}
  const allowed = new Set(['name', 'admissionStatus'])
  const keys = Object.keys(body || {})
  if (keys.some((key) => !allowed.has(key))) {
    throw new AppError(400, 'Only course name and admission status can be changed')
  }
  if (!partial || Object.hasOwn(body || {}, 'name')) {
    if (!isText(body?.name) || body.name.trim().length > 120) errors.name = 'Name is required (up to 120 characters)'
  }
  if (!partial || Object.hasOwn(body || {}, 'admissionStatus')) {
    if (!['Open', 'Closed'].includes(body?.admissionStatus)) errors.admissionStatus = 'Choose Open or Closed'
  }
  if (partial && keys.length === 0) errors.course = 'Provide a name or admission status to update'
  if (Object.keys(errors).length) throw new AppError(400, 'Please check the submitted fields', errors)
}

export function validateStudentImport(body) {
  if (!Array.isArray(body?.students) || body.students.length === 0 || body.students.length > 500) {
    throw new AppError(400, 'Provide between 1 and 500 student rows', { students: 'Import must contain between 1 and 500 rows' })
  }
  const errors = []
  const cnicSeen = new Set()
  const rollSeen = new Set()
  const normalized = body.students.map((record, index) => {
    const row = Number.isInteger(record?.row) && record.row >= 2 ? record.row : index + 2
    const rawCnic = typeof record?.cnic === 'string' ? record.cnic.trim() : ''
    const validCnic = /^\d{5}-?\d{7}-?\d$/.test(rawCnic)
    const cnic = validCnic ? rawCnic.replace(/-/g, '') : ''
    const rollNumber = typeof record?.rollNumber === 'string' ? record.rollNumber.trim().toUpperCase() : ''
    const name = typeof record?.name === 'string' ? record.name.trim() : ''
    const rowErrors = {}
    if (!name || name.length > 100) rowErrors.name = 'Name is required (up to 100 characters)'
    if (!validCnic) rowErrors.cnic = 'CNIC must contain 13 digits (optional standard hyphens)'
    if (!rollNumber || rollNumber.length > 32) rowErrors.rollNumber = 'Roll number is required (up to 32 characters)'
    if (cnicSeen.has(cnic)) rowErrors.cnic = 'Duplicate CNIC in this file'
    if (rollSeen.has(rollNumber)) rowErrors.rollNumber = 'Duplicate roll number in this file'
    cnicSeen.add(cnic)
    rollSeen.add(rollNumber)
    if (Object.keys(rowErrors).length) errors.push({ row, errors: rowErrors })
    return { name, cnic, rollNumber, row }
  })
  if (errors.length) throw new AppError(400, 'Some spreadsheet rows are invalid', { rows: errors })
  return normalized
}

export function validateApplication(body, fields) {
  const values = body?.fields
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    throw new AppError(400, 'Please provide the required application information', { fields: 'Application fields are required' })
  }
  const errors = {}
  const clean = {}
  for (const field of fields) {
    const value = typeof values[field.key] === 'string' ? values[field.key].trim() : ''
    if (field.required && !value) errors[field.key] = `${field.label} is required`
    if (value.length > (field.maxLength || 500)) errors[field.key] = `${field.label} is too long`
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[field.key] = 'Enter a valid email address'
    clean[field.key] = value
  }
  if (Object.keys(errors).length) throw new AppError(400, 'Please check the application fields', errors)
  return clean
}

export function validateLeave(body) {
  const errors = {}
  if (typeof body?.reason !== 'string' || !body.reason.trim() || body.reason.trim().length > 1000) errors.reason = 'Reason is required (up to 1000 characters)'
  const isDate = (value) => typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`))
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
  const start = Date.parse(body?.startDate)
  const end = Date.parse(body?.endDate)
  if (!isDate(body?.startDate)) errors.startDate = 'Enter a valid date in YYYY-MM-DD format'
  if (!isDate(body?.endDate)) errors.endDate = 'Enter a valid date in YYYY-MM-DD format'
  if (Number.isFinite(start) && Number.isFinite(end) && end < start) errors.endDate = 'End date must be on or after the start date'
  if (body?.attachment !== undefined && body.attachment !== null) {
    const { data, mimeType, name } = body.attachment || {}
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType) || typeof data !== 'string') errors.attachment = 'Attach a JPEG, PNG, or WebP image'
    else if (name !== undefined && (typeof name !== 'string' || name.length > 120 || /[\r\n\\/]/.test(name))) errors.attachment = 'Attachment file name is invalid'
    else {
      const buffer = Buffer.from(data, 'base64')
      const validSignature = mimeType === 'image/jpeg'
        ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer.at(-2) === 0xff && buffer.at(-1) === 0xd9
        : mimeType === 'image/png'
          ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP'
      if (!buffer.length || buffer.length > 2 * 1024 * 1024) errors.attachment = 'Image must be no larger than 2 MB'
      else if (!validSignature) errors.attachment = 'Image contents do not match the selected file type'
    }
  }
  if (Object.keys(errors).length) throw new AppError(400, 'Please check the leave request', errors)
}

export function validateLeaveDecision(body) {
  const errors = {}
  if (!['Approved', 'Rejected'].includes(body?.status)) errors.status = 'Choose Approved or Rejected'
  if (body?.decisionNote !== undefined && (typeof body.decisionNote !== 'string' || body.decisionNote.trim().length > 500)) errors.decisionNote = 'Decision note must be up to 500 characters'
  if (Object.keys(errors).length) throw new AppError(400, 'Please check the decision', errors)
}
