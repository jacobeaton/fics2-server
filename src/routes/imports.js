import { Router } from "express"
import bodyParser from "body-parser"
import couchbase, { N1qlQuery } from "couchbase"
import fileUpload from "express-fileupload"
import csv from "csvtojson"

import config from "../../config.json"

// Set up couchbase cluster and bucket //
const cbConfig = config.couchbase
const cluster = new couchbase.Cluster(cbConfig.cluster)
cluster.authenticate(cbConfig.username, cbConfig.password)
const bucket = cluster.openBucket(cbConfig.bucket)

const asyncBucketQuery = async (query, _bucket = bucket) =>
  new Promise((resolve, reject) => {
    _bucket.query(query, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })

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
  const resultArray = await Promise.all(
    jsonArray.map(async item => {
      const { cost, systemQty, description } = item
      const uploadItem = {
        cost: parseFloat(cost),
        systemQty: parseFloat(systemQty),
        description: cleanStr(description),
        partNumber: item.partNumber,
        type: "part",
        void: false
      }
      const results = await bucket.upsert(
        uploadItem.partNumber,
        uploadItem,
        (error, result) => (error ? { error } : { result })
      )
      return { partNumber: item.partNumber, results }
    })
  )
  return resultArray
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
      console.log(error)
      res.status(500).send({ error })
    })
})

export default router
