const API_BASE = '/api'

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || 'The request could not be completed')
    error.status = response.status
    error.fields = payload.errors || {}
    throw error
  }
  return payload
}

async function getCsrfToken() {
  const response = await fetch(`${API_BASE}/auth/csrf`, { credentials: 'include' })
  const payload = await readResponse(response)
  return payload.data.csrfToken
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' }
  const options = { method, headers, credentials: 'include' }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    headers['X-CSRF-Token'] = await getCsrfToken()
  }

  return readResponse(await fetch(`${API_BASE}${path}`, options))
}

export function fieldErrors(error) {
  return error.fields || {}
}

export function apiErrorMessage(error) {
  const details = Object.values(fieldErrors(error)).filter(Boolean).join('. ')
  return details ? `${error.message}: ${details}` : error.message
}
