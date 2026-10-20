import cors from 'cors'
import express from 'express'
import session from 'express-session'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'
import authRouter from './routes/auth.routes.js'
import courseRouter from './routes/course.routes.js'
import applicationRouter from './routes/application.routes.js'
import healthRouter from './routes/health.routes.js'
import leaveRouter from './routes/leave.routes.js'

if (env.sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be set to a random value of at least 32 characters')
}
if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535')
}

const app = express()
const secureCookie = env.cookieSecure || env.nodeEnv === 'production'

app.disable('x-powered-by')
if (secureCookie) app.set('trust proxy', 1)

app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) return callback(null, true)
    const error = new Error('Origin is not allowed by CORS')
    error.status = 403
    callback(error)
  },
  credentials: true,
}))
app.use(express.json({ limit: '4mb' }))
app.use(session({
  name: 'smit.sid',
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000,
  },
}))
app.use('/api', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/courses', courseRouter)
app.use('/api/applications', applicationRouter)
app.use('/api/leaves', leaveRouter)
app.use(notFoundHandler)
app.use(errorHandler)

export default app
