import { Router } from 'express'
import { createLeave, getAllLeaves, getLeaveDetails, getMyLeaves, updateLeaveDecision } from '../controllers/leave.controller.js'
import { requireAdmin, requireAuth, requireCsrf, requireStudent } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/http.js'

const leaveRouter = Router()

leaveRouter.post('/', requireAuth, requireStudent, requireCsrf, asyncHandler(createLeave))
leaveRouter.get('/mine', requireAuth, requireStudent, asyncHandler(getMyLeaves))
leaveRouter.get('/', requireAuth, requireAdmin, asyncHandler(getAllLeaves))
leaveRouter.get('/:id', requireAuth, requireAdmin, asyncHandler(getLeaveDetails))
leaveRouter.patch('/:id', requireAuth, requireAdmin, requireCsrf, asyncHandler(updateLeaveDecision))

export default leaveRouter
