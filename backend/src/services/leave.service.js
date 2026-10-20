import { randomUUID } from 'node:crypto'
import { AppError } from '../utils/http.js'
import { readCollection, updateCollection } from './jsonStore.js'

function publicLeave(leave, { includeAttachment = false } = {}) {
  const { attachment, ...record } = leave
  return {
    ...record,
    ...(attachment ? { attachment: includeAttachment ? attachment : { name: attachment.name, mimeType: attachment.mimeType, size: attachment.size } } : {}),
  }
}

export async function submitLeave({ student, reason, startDate, endDate, attachment }) {
  return updateCollection('leaves', (leaves) => {
    const leave = {
      id: randomUUID(),
      student: { id: student.id, name: student.name, rollNumber: student.rollNumber },
      reason: reason.trim(),
      startDate,
      endDate,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      decisionNote: '',
      decidedAt: null,
      ...(attachment ? {
        attachment: {
          name: attachment.name || 'leave-attachment',
          mimeType: attachment.mimeType,
          size: Buffer.from(attachment.data, 'base64').length,
          data: attachment.data,
        },
      } : {}),
    }
    leaves.unshift(leave)
    return publicLeave(leave)
  })
}

export async function listStudentLeaves(studentId) {
  return (await readCollection('leaves'))
    .filter((leave) => leave.student.id === studentId)
    .map((leave) => publicLeave(leave))
}

export async function listLeaves(status) {
  const leaves = await readCollection('leaves')
  return leaves
    .filter((leave) => !status || leave.status === status)
    .map((leave) => publicLeave(leave))
}

export async function getLeave(id) {
  const leave = (await readCollection('leaves')).find((record) => record.id === id)
  if (!leave) throw new AppError(404, 'Leave request not found')
  return publicLeave(leave, { includeAttachment: true })
}

export async function decideLeave(id, status, decisionNote = '') {
  return updateCollection('leaves', (leaves) => {
    const leave = leaves.find((record) => record.id === id)
    if (!leave) throw new AppError(404, 'Leave request not found')
    if (leave.status !== 'Pending') throw new AppError(409, 'This leave request has already been decided')
    leave.status = status
    leave.decisionNote = decisionNote.trim()
    leave.decidedAt = new Date().toISOString()
    return publicLeave(leave)
  })
}
