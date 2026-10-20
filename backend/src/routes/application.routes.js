import { Router } from 'express'
import { getApplicationFields, getMyApplications, submitApplication } from '../controllers/application.controller.js'
import { requireAuth, requireCsrf, requireStudent } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/http.js'

const applicationRouter = Router()

applicationRouter.get('/fields', getApplicationFields)
applicationRouter.get('/mine', requireAuth, requireStudent, asyncHandler(getMyApplications))
applicationRouter.post('/', requireAuth, requireStudent, requireCsrf, asyncHandler(submitApplication))

export default applicationRouter
