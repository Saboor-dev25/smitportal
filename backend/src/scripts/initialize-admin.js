import '../config/env.js'
import { createInitialAdmin } from '../services/auth.service.js'
import { validateAdminInput } from '../utils/validation.js'

const credentials = {
  name: process.env.INIT_ADMIN_NAME || '',
  username: process.env.INIT_ADMIN_USERNAME || '',
  password: process.env.INIT_ADMIN_PASSWORD || '',
}

try {
  validateAdminInput(credentials)
  const created = await createInitialAdmin(credentials)
  console.log(created
    ? 'Initial administrator created.'
    : 'An administrator already exists; no changes were made.')
} catch (error) {
  console.error(error.errors || error.message)
  process.exitCode = 1
}
