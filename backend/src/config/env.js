import dotenv from 'dotenv'

dotenv.config()

const parseOrigins = (value) => value
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const defaultAdmissionFields = [
  { key: 'phone', label: 'Phone number', type: 'tel', required: true, maxLength: 30 },
  { key: 'email', label: 'Email address', type: 'email', required: true, maxLength: 120 },
  { key: 'education', label: 'Last completed education', type: 'text', required: true, maxLength: 120 },
  { key: 'message', label: 'Why are you interested?', type: 'textarea', required: false, maxLength: 1000 },
]

function parseAdmissionFields(value) {
  if (!value) return defaultAdmissionFields
  try {
    const fields = JSON.parse(value)
    if (!Array.isArray(fields) || fields.length < 1 || fields.length > 12) throw new Error()
    const keys = new Set()
    for (const field of fields) {
      if (!field || !/^[a-z][a-zA-Z0-9_]{0,39}$/.test(field.key) || keys.has(field.key)
        || typeof field.label !== 'string' || !field.label.trim() || field.label.trim().length > 80
        || !['text', 'tel', 'email', 'textarea'].includes(field.type)
        || typeof field.required !== 'boolean'
        || !Number.isInteger(field.maxLength) || field.maxLength < 1 || field.maxLength > 2000) throw new Error()
      keys.add(field.key)
    }
    return fields
  } catch {
    throw new Error('ADMISSION_FORM_FIELDS must be a valid JSON array of field definitions')
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT || '3001', 10),
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS || 'http://localhost:5173'),
  sessionSecret: process.env.SESSION_SECRET || '',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  admissionFields: parseAdmissionFields(process.env.ADMISSION_FORM_FIELDS || ''),
}
