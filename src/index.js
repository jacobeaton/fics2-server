import "babel-polyfill"
import express from "express"
import cors from "cors"

import config from "../.config"
import router from "./routes/routes"
import imports from "./routes/imports"

const app = express()

app.use("/api", router)
app.use("/imports", imports)

app.use(cors())
app.listen(config.express.port, () => {
  console.log(`Server is listening on port ${config.express.port}...`)
})

export default app
