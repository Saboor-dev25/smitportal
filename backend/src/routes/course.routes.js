import { Router } from 'express'
import { createCourse, editCourse, getCourses } from '../controllers/course.controller.js'
import { requireAdmin, requireCsrf } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/http.js'

const courseRouter = Router()

courseRouter.get('/', asyncHandler(getCourses))
courseRouter.post('/', requireAdmin, requireCsrf, asyncHandler(createCourse))
courseRouter.patch('/:id', requireAdmin, requireCsrf, asyncHandler(editCourse))

export default courseRouter
