import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const keyLength = 64

export async function hashPassword(password) {
  const salt = randomBytes(16)
  const derivedKey = await scrypt(password, salt, keyLength)
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`
}

export async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string') return false
  const [algorithm, saltHex, hashHex] = storedHash.split('$')
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false

  const expected = Buffer.from(hashHex, 'hex')
  if (expected.length !== keyLength) return false
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), keyLength)
  return timingSafeEqual(expected, actual)
}
