export function notFoundHandler(request, response) {
  response.status(404).json({
    success: false,
    message: `Route ${request.method} ${request.originalUrl} was not found`,
  })
}

export function errorHandler(error, _request, response, next) {
  if (response.headersSent) return next(error)

  const status = Number.isInteger(error.status) ? error.status : 500
  const body = {
    success: false,
    message: status >= 500 ? 'Internal server error' : error.message,
  }
  if (status < 500 && error.errors) body.errors = error.errors
  if (status >= 500) console.error(error)
  response.status(status).json(body)
}
