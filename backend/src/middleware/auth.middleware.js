import { AppError } from '../utils/http.js'

export function requireAuth(request, _response, next) {
  if (!request.session.user) return next(new AppError(401, 'Authentication is required'))
  next()
}

export function requireAdmin(request, _response, next) {
  if (request.session.user?.role !== 'admin') {
    return next(new AppError(request.session.user ? 403 : 401, 'Administrator access is required'))
  }
  next()
}

export function requireStudent(request, _response, next) {
  if (request.session.user?.role !== 'student') {
    return next(new AppError(request.session.user ? 403 : 401, 'Student access is required'))
  }
  next()
}

export function requireCsrf(request, _response, next) {
  const expected = request.session.csrfToken
  const received = request.get('x-csrf-token')
  if (!expected || !received || expected !== received) {
    return next(new AppError(403, 'CSRF token is missing or invalid'))
  }
  next()
}
