import { randomUUID } from 'node:crypto'
import { AppError } from '../utils/http.js'
import { readCollection, updateCollection } from './jsonStore.js'

export async function listCourses() {
  return readCollection('courses')
}

export async function addCourse({ name, admissionStatus }) {
  return updateCollection('courses', (courses) => {
    const course = {
      id: randomUUID(),
      name: name.trim(),
      admissionStatus,
      createdAt: new Date().toISOString(),
    }
    courses.unshift(course)
    return course
  })
}

export async function updateCourse(id, changes) {
  return updateCollection('courses', (courses) => {
    const course = courses.find((record) => record.id === id)
    if (!course) throw new AppError(404, 'Course not found')
    if (changes.name !== undefined) course.name = changes.name.trim()
    if (changes.admissionStatus !== undefined) course.admissionStatus = changes.admissionStatus
    return course
  })
}
