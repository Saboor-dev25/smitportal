import { decideLeave, getLeave, listLeaves, listStudentLeaves, submitLeave } from '../services/leave.service.js'
import { AppError, sendSuccess } from '../utils/http.js'
import { validateLeave, validateLeaveDecision } from '../utils/validation.js'

export async function createLeave(request, response) {
  validateLeave(request.body)
  const leave = await submitLeave({ student: request.session.user, ...request.body })
  sendSuccess(response, 201, 'Leave request submitted', { leave })
}

export async function getMyLeaves(request, response) {
  const leaves = await listStudentLeaves(request.session.user.id)
  sendSuccess(response, 200, 'Your leave history loaded', { leaves })
}

export async function getAllLeaves(request, response) {
  const { status } = request.query
  if (status && !['Pending', 'Approved', 'Rejected'].includes(status)) {
    throw new AppError(400, 'Invalid leave status filter', { status: 'Choose Pending, Approved, or Rejected' })
  }
  const leaves = await listLeaves(status)
  sendSuccess(response, 200, 'Leave requests loaded', { leaves })
}

export async function getLeaveDetails(request, response) {
  const leave = await getLeave(request.params.id)
  sendSuccess(response, 200, 'Leave request loaded', { leave })
}

export async function updateLeaveDecision(request, response) {
  validateLeaveDecision(request.body)
  const leave = await decideLeave(request.params.id, request.body.status, request.body.decisionNote)
  sendSuccess(response, 200, 'Leave request updated', { leave })
}
