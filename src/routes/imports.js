import { Router } from "express"
import bodyParser from "body-parser"
import couchbase, { N1qlQuery } from "couchbase"
import fileUpload from "express-fileupload"
import csv from "csvtojson"

import config from "../../.config.json"

// Set up couchbase cluster and bucket //
const cbConfig = config.couchbase
const cluster = new couchbase.Cluster(cbConfig.cluster)
cluster.authenticate(cbConfig.username, cbConfig.password)
const bucket = cluster.openBucket(cbConfig.bucket)

// create express.Router() and use bodyParser middleware //
const router = Router()
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
router.use(fileUpload())

const cleanStr = str =>
  str
    .replace(/"/, "in")
    .replace(/'/, "ft")
    .replace(/,/, "")
    .substr(0, 100)

const importParts = async filePath => {
  const jsonArray = await csv().fromFile(filePath)
  jsonArray.map(item => {
    const { cost, systemQty, description, ...rest } = item
    const uploadItem = {
      cost: parseFloat(cost),
      systemQty: parseFloat(systemQty),
      description: cleanStr(description),
      ...rest
    }
    const statement = `UPSERT INTO fics (KEY, VALUE) VALUES("${
      uploadItem.partNumber
    }", ${JSON.stringify(uploadItem)})`
    const query = N1qlQuery.fromString(statement)
    bucket.query(query, error => {
      if (error) {
        throw error
      }
    })
  })
  return { success: true }
}

router.post("/parts", (req, res) => {
  if (!req.files) {
    res.status(400).send({ error: "No files were uploaded." })
  }
  const { upload } = req.files
  upload
    .mv(`./temp/${upload.name}`)
    .then(async error => {
      if (error) {
        throw error
      }
      return importParts(`./temp/${upload.name}`)
    })
    .then(result => {
      res.status(200).send({ result })
    })
    .catch(error => {
      res.status(500).send({ error })
    })
})

export default router
