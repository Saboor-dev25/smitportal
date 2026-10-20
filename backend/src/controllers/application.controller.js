import { applicationFields, createApplication, listStudentApplications } from '../services/application.service.js'
import { sendSuccess } from '../utils/http.js'
import { validateApplication } from '../utils/validation.js'
import { AppError } from '../utils/http.js'

export function getApplicationFields(_request, response) {
  sendSuccess(response, 200, 'Application form loaded', { fields: applicationFields })
}

export async function submitApplication(request, response) {
  if (typeof request.body?.courseId !== 'string' || !request.body.courseId.trim()) {
    throw new AppError(400, 'Please provide a course', { courseId: 'Course is required' })
  }
  const fields = validateApplication(request.body, applicationFields)
  const application = await createApplication({
    courseId: request.body.courseId,
    student: request.session.user,
    fields,
  })
  sendSuccess(response, 201, 'Course application submitted', { application })
}

export async function getMyApplications(request, response) {
  const applications = await listStudentApplications(request.session.user.id)
  sendSuccess(response, 200, 'Your applications loaded', { applications })
}
