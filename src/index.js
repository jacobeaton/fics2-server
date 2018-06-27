import 'babel-polyfill'
import express from 'express'

import config from '../.config'
import router from './routes/routes'

const app = express()

app.use('/api', router)
app.listen(config.express.port, () => {
  console.log(`Server is listening on port ${config.express.port}...`)
})

export default app
