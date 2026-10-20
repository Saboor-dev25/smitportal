export function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next)
  }
}

export class AppError extends Error {
  constructor(status, message, errors) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export function sendSuccess(response, status, message, data) {
  const body = { success: true, message }
  if (data !== undefined) body.data = data
  response.status(status).json(body)
}
