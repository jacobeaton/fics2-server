import "babel-polyfill"
import express from "express"
import cors from "cors"

import config from "../config"
import Router from "./routes/routes"
import Imports from "./routes/imports"
import Exports from "./routes/exports"
import Auth from "./routes/auth"
import Phantoms from "./routes/phantoms/phantoms"

const app = express()

app.use(cors())
app.use("/api", Router)
app.use("/imports", Imports)
app.use("/exports", Exports)
app.use("/auth", Auth)
app.use("/phantoms", Phantoms)

app.listen(config.express.port, () => {
  console.log(`Server is listening on port ${config.express.port}...`)
})

export default app
