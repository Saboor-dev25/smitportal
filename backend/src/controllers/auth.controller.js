import { randomBytes } from 'node:crypto'
import { promisify } from 'node:util'
import {
  authenticateAdmin,
  authenticateStudent,
  addStudentRosterRecord,
  importStudentRoster,
  changeAdminPassword,
  createAdmin,
  createInitialAdmin,
  isInitialAdminSetupAvailable,
  registerStudent,
} from '../services/auth.service.js'
import { AppError, sendSuccess } from '../utils/http.js'
import {
  validateAdminInput,
  validateCredentials,
  validatePasswordChange,
  validateStudentSignup,
  validateStudentRosterRecord,
  validateStudentImport,
} from '../utils/validation.js'

const regenerateSession = promisify((request, callback) => request.session.regenerate(callback))
const saveSession = (request) => new Promise((resolve, reject) => {
  request.session.save((error) => (error ? reject(error) : resolve()))
})
const destroySession = promisify((request, callback) => request.session.destroy(callback))

function makeCsrfToken() {
  return randomBytes(32).toString('hex')
}

async function establishSession(request, user) {
  await regenerateSession(request)
  request.session.user = user
  request.session.csrfToken = makeCsrfToken()
  await saveSession(request)
}

export function getCsrfToken(request, response) {
  response.set('Cache-Control', 'no-store')
  request.session.csrfToken ||= makeCsrfToken()
  sendSuccess(response, 200, 'CSRF token issued', { csrfToken: request.session.csrfToken })
}

export function getCurrentSession(request, response) {
  response.set('Cache-Control', 'no-store')
  sendSuccess(response, 200, 'Session loaded', { user: request.session.user || null })
}

export async function getAdminSetupStatus(_request, response) {
  const setupAvailable = await isInitialAdminSetupAvailable()
  sendSuccess(response, 200, 'Initial administrator setup status loaded', { setupAvailable })
}

export async function adminSignup(request, response) {
  validateAdminInput(request.body)
  const user = await createInitialAdmin(request.body)
  if (!user) throw new AppError(409, 'Initial administrator setup is already complete')
  await establishSession(request, user)
  sendSuccess(response, 201, 'Initial administrator account created', { user })
}

export async function adminLogin(request, response) {
  validateCredentials(request.body)
  const user = await authenticateAdmin(request.body.username, request.body.password)
  await establishSession(request, user)
  sendSuccess(response, 200, 'Admin login successful', { user })
}

export async function studentLogin(request, response) {
  validateCredentials(request.body, { student: true })
  const user = await authenticateStudent(request.body.rollNumber, request.body.password)
  await establishSession(request, user)
  sendSuccess(response, 200, 'Student login successful', { user })
}

export async function studentSignup(request, response) {
  validateStudentSignup(request.body)
  const user = await registerStudent(request.body)
  await establishSession(request, user)
  sendSuccess(response, 201, 'Student account created', { user })
}

export async function addAdmin(request, response) {
  validateAdminInput(request.body)
  const user = await createAdmin(request.body)
  sendSuccess(response, 201, 'Administrator created', { user })
}

export async function addStudentRecord(request, response) {
  validateStudentRosterRecord(request.body)
  const student = await addStudentRosterRecord(request.body)
  sendSuccess(response, 201, 'Student roster record added', { student })
}

export async function importStudents(request, response) {
  const records = validateStudentImport(request.body)
  const students = await importStudentRoster(records)
  sendSuccess(response, 201, `${students.length} students imported`, { count: students.length, students })
}

export async function updateAdminPassword(request, response) {
  validatePasswordChange(request.body)
  await changeAdminPassword(
    request.session.user.id,
    request.body.currentPassword,
    request.body.newPassword,
  )
  sendSuccess(response, 200, 'Password updated')
}

export async function logout(request, response) {
  await destroySession(request)
  response.clearCookie('smit.sid')
  sendSuccess(response, 200, 'Logged out')
}

