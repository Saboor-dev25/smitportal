import { randomUUID } from 'node:crypto'
import { AppError } from '../utils/http.js'
import { env } from '../config/env.js'
import { readCollection, updateCollection } from './jsonStore.js'

export const applicationFields = env.admissionFields

const safeApplication = ({ id, courseId, courseName, applicant, fields, status, createdAt }) => ({
  id, courseId, courseName, applicant, fields, status, createdAt,
})

export async function createApplication({ courseId, student, fields }) {
  const courses = await readCollection('courses')
  const course = courses.find((record) => record.id === courseId)
  if (!course) throw new AppError(404, 'Course not found')
  if (course.admissionStatus !== 'Open') throw new AppError(403, 'Applications are closed for this course')
  return updateCollection('applications', (applications) => {
    if (applications.some((record) => record.courseId === courseId && record.applicant.id === student.id)) {
      throw new AppError(409, 'You have already applied to this course')
    }
    const application = {
      id: randomUUID(),
      courseId,
      courseName: course.name,
      applicant: { id: student.id, name: student.name, rollNumber: student.rollNumber },
      fields,
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    }
    applications.unshift(application)
    return safeApplication(application)
  })
}

export async function listStudentApplications(studentId) {
  return (await readCollection('applications'))
    .filter((record) => record.applicant.id === studentId)
    .map(safeApplication)
}
