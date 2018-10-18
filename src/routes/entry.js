// @format
import { Router } from "express"
import bodyParser from "body-parser"
import couchbase, { N1qlQuery } from "couchbase"

import config from "../../config.json"

// Set up couchbase cluster and bucket //
const cbConfig = config.couchbase
const cluster = new couchbase.Cluster(cbConfig.cluster)
cluster.authenticate(cbConfig.username, cbConfig.password)
const bucket = cluster.openBucket(cbConfig.bucket)

// create express.Router() and use bodyParser middleware //
const router = Router()
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))

const asyncBucketGet = async (id, _bucket = bucket) =>
  new Promise((resolve, reject) => {
    _bucket.get(id, (err, result) => {
      if (err.code === 13) resolve(false)
      else if (err) reject(err)
      else resolve(result)
    })
  })

const asyncBucketUpsert = async (id, doc, _bucket = bucket) => {
  new Promise((resolve, reject) => {
    _bucket.upsert(id, doc, (err, result) => {
      if (err) reject(err)
      else {
        resolve(result)
      }
    })
  })
}

const newEntryId = async (deviceId, partNumber) => {
  const UUID = uuid()
  const entryId = `${deviceId}-${partNumber}-${UUID.substr(UUID.length - 4, 4)}`
  const result = await asyncBucketGet(entryId)
  if (result) {
    newEntryId(deviceId, partNumber)
  }
  return entryId
}

router.post("/new", async (req, res) => {
  try {
    const { entry, context } = req.body
    if (!entry || !context)
      throw new Error(
        `The request must have entry and context properties on the request body.`
      )
    const newEntry = Object.assign({}, entry, {
      entryId: await newEntryId(context.device.deviceId, entry.partNumber)
    })
    const result = await asyncBucketUpsert(newEntry.entryId, newEntry)
    res.status(200).send({ result })
  } catch (error) {
    res.status(400).send({ error })
  }
})

export default router
