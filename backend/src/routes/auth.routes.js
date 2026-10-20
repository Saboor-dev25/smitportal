import { Router } from 'express'
import {
  addAdmin,
  addStudentRecord,
  adminLogin,
  adminSignup,
  getAdminSetupStatus,
  getCsrfToken,
  getCurrentSession,
  importStudents,
  logout,
  studentLogin,
  studentSignup,
  updateAdminPassword,
} from '../controllers/auth.controller.js'
import { requireAdmin, requireAuth, requireCsrf } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/http.js'

const authRouter = Router()

authRouter.get('/csrf', getCsrfToken)
authRouter.get('/session', getCurrentSession)
authRouter.get('/admin/setup-status', asyncHandler(getAdminSetupStatus))
authRouter.post('/admin/signup', requireCsrf, asyncHandler(adminSignup))
authRouter.post('/admin/login', requireCsrf, asyncHandler(adminLogin))
authRouter.post('/admin/password', requireAuth, requireAdmin, requireCsrf, asyncHandler(updateAdminPassword))
authRouter.post('/admin/users', requireAuth, requireAdmin, requireCsrf, asyncHandler(addAdmin))
authRouter.post('/admin/students', requireAuth, requireAdmin, requireCsrf, asyncHandler(addStudentRecord))
authRouter.post('/admin/students/import', requireAuth, requireAdmin, requireCsrf, asyncHandler(importStudents))
authRouter.post('/student/signup', requireCsrf, asyncHandler(studentSignup))
authRouter.post('/student/login', requireCsrf, asyncHandler(studentLogin))
authRouter.post('/logout', requireAuth, requireCsrf, asyncHandler(logout))

export default authRouter
