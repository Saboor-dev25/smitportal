import app from './app.js'
import { env } from './config/env.js'
import { initializeDataFiles } from './services/jsonStore.js'

await initializeDataFiles()

app.listen(env.port, () => {
  console.log(`SMIT Portal API listening on port ${env.port}`)
})
