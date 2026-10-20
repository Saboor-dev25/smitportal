import { addCourse, listCourses, updateCourse } from '../services/course.service.js'
import { sendSuccess } from '../utils/http.js'
import { validateCourse } from '../utils/validation.js'

export async function getCourses(_request, response) {
  sendSuccess(response, 200, 'Courses loaded', { courses: await listCourses() })
}

export async function createCourse(request, response) {
  validateCourse(request.body)
  const course = await addCourse(request.body)
  sendSuccess(response, 201, 'Course created', { course })
}

export async function editCourse(request, response) {
  validateCourse(request.body, { partial: true })
  const course = await updateCourse(request.params.id, request.body)
  sendSuccess(response, 200, 'Course updated', { course })
}
