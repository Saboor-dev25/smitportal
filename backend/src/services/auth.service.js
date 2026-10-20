import { randomUUID } from 'node:crypto'
import { AppError } from '../utils/http.js'
import { readCollection, updateCollection } from './jsonStore.js'
import { hashPassword, verifyPassword } from './password.service.js'

const normalizedUsername = (value) => value.trim().toLowerCase()
const normalizedRoll = (value) => value.trim().toUpperCase()
const normalizedCnic = (value) => value.replace(/\D/g, '')
const publicUser = ({ id, name, username, rollNumber, role }) => ({
  id,
  name,
  ...(username ? { username } : {}),
  ...(rollNumber ? { rollNumber } : {}),
  role,
})

export async function authenticateAdmin(username, password) {
  const admins = await readCollection('admins')
  const admin = admins.find((record) => record.username === normalizedUsername(username))
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    throw new AppError(401, 'Invalid username or password')
  }
  return publicUser({ ...admin, role: 'admin' })
}

export async function authenticateStudent(rollNumber, password) {
  const students = await readCollection('students')
  const student = students.find((record) => record.rollNumber === normalizedRoll(rollNumber))
  if (!student?.registered || !(await verifyPassword(password, student.passwordHash))) {
    throw new AppError(401, 'Invalid roll number or password')
  }
  return publicUser({ ...student, role: 'student' })
}

export async function registerStudent({ cnic, rollNumber, password }) {
  const existingStudents = await readCollection('students')
  const existingStudent = existingStudents.find((record) => (
    record.cnic === normalizedCnic(cnic)
    && record.rollNumber === normalizedRoll(rollNumber)
  ))
  if (!existingStudent) throw new AppError(404, 'No student record matches the supplied CNIC and roll number')
  if (existingStudent.registered) throw new AppError(409, 'This student account is already registered')

  const passwordHash = await hashPassword(password)
  return updateCollection('students', (students) => {
    const student = students.find((record) => (
      record.cnic === normalizedCnic(cnic)
      && record.rollNumber === normalizedRoll(rollNumber)
    ))
    if (!student) throw new AppError(404, 'No student record matches the supplied CNIC and roll number')
    if (student.registered) throw new AppError(409, 'This student account is already registered')
    student.passwordHash = passwordHash
    student.registered = true
    student.registeredAt = new Date().toISOString()
    return publicUser({ ...student, role: 'student' })
  })
}

export async function addStudentRosterRecord({ name, cnic, rollNumber }) {
  const normalizedCnicValue = normalizedCnic(cnic)
  const normalizedRollValue = normalizedRoll(rollNumber)
  const existingStudents = await readCollection('students')
  if (existingStudents.some((record) => (
    record.cnic === normalizedCnicValue || record.rollNumber === normalizedRollValue
  ))) {
    throw new AppError(409, 'That CNIC or roll number is already in the student roster')
  }

  return updateCollection('students', (students) => {
    if (students.some((record) => (
      record.cnic === normalizedCnicValue || record.rollNumber === normalizedRollValue
    ))) {
      throw new AppError(409, 'That CNIC or roll number is already in the student roster')
    }
    const student = {
      id: randomUUID(),
      name: name.trim(),
      cnic: normalizedCnicValue,
      rollNumber: normalizedRollValue,
      registered: false,
      passwordHash: null,
      createdAt: new Date().toISOString(),
    }
    students.push(student)
    return publicUser({ ...student, role: 'student' })
  })
}

export async function importStudentRoster(records) {
  return updateCollection('students', (students) => {
    const errors = []
    const cnicSeen = new Set(students.map((student) => student.cnic))
    const rollSeen = new Set(students.map((student) => student.rollNumber))
    for (const record of records) {
      const rowErrors = {}
      if (cnicSeen.has(record.cnic)) rowErrors.cnic = 'CNIC already exists in the roster'
      if (rollSeen.has(record.rollNumber)) rowErrors.rollNumber = 'Roll number already exists in the roster'
      if (Object.keys(rowErrors).length) errors.push({ row: record.row, errors: rowErrors })
      cnicSeen.add(record.cnic)
      rollSeen.add(record.rollNumber)
    }
    if (errors.length) throw new AppError(409, 'Import contains records that already exist', { rows: errors })
    const created = records.map(({ row: _row, ...record }) => ({
      id: randomUUID(),
      ...record,
      registered: false,
      passwordHash: null,
      createdAt: new Date().toISOString(),
    }))
    students.push(...created)
    return created.map((student) => publicUser({ ...student, role: 'student' }))
  })
}

export async function createAdmin({ name, username, password }) {
  const normalized = normalizedUsername(username)
  const existingAdmins = await readCollection('admins')
  if (existingAdmins.some((record) => record.username === normalized)) {
    throw new AppError(409, 'That username is already in use')
  }

  const passwordHash = await hashPassword(password)
  return updateCollection('admins', (admins) => {
    if (admins.some((record) => record.username === normalized)) {
      throw new AppError(409, 'That username is already in use')
    }
    const admin = {
      id: randomUUID(),
      name: name.trim(),
      username: normalized,
      passwordHash,
      createdAt: new Date().toISOString(),
    }
    admins.push(admin)
    return publicUser({ ...admin, role: 'admin' })
  })
}

export async function changeAdminPassword(adminId, currentPassword, newPassword) {
  const existingAdmins = await readCollection('admins')
  const existingAdmin = existingAdmins.find((record) => record.id === adminId)
  if (!existingAdmin || !(await verifyPassword(currentPassword, existingAdmin.passwordHash))) {
    throw new AppError(401, 'Current password is incorrect')
  }
  const passwordHash = await hashPassword(newPassword)
  await updateCollection('admins', async (admins) => {
    const admin = admins.find((record) => record.id === adminId)
    if (!admin || !(await verifyPassword(currentPassword, admin.passwordHash))) {
      throw new AppError(401, 'Current password is incorrect')
    }
    admin.passwordHash = passwordHash
    admin.passwordChangedAt = new Date().toISOString()
  })
}

export async function isInitialAdminSetupAvailable() {
  return (await readCollection('admins')).length === 0
}

export async function createInitialAdmin({ name, username, password }) {
  if (!(await isInitialAdminSetupAvailable())) return null
  const passwordHash = await hashPassword(password)
  return updateCollection('admins', (admins) => {
    if (admins.length > 0) return null
    const admin = {
      id: randomUUID(),
      name: name.trim(),
      username: normalizedUsername(username),
      passwordHash,
      createdAt: new Date().toISOString(),
    }
    admins.push(admin)
    return publicUser({ ...admin, role: 'admin' })
  })
}
