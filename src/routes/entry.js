// @format
import { Router } from "express"
import bodyParser from "body-parser"
import couchbase, { N1qlQuery } from "couchbase"
import uuid from "uuid4"

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
      if (err) {
        if (err.code === 13) resolve(false)
        else reject(err)
      } else resolve(result)
    })
  })

const asyncBucketUpsert = async (id, doc, _bucket = bucket) => {
  return new Promise((resolve, reject) => {
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

router.get("/:id", async (req, res) => {
  console.log(req.params)
  const result = await asyncBucketGet(req.params.id)
  console.log(result)
  return res.status(200).send({ result })
})

router.post("/new", async (req, res) => {
  try {
    const { entry, deviceId } = req.body
    if (!entry || !deviceId)
      throw new Error(
        `The request must have entry and deviceId properties on the request body.`
      )
    const newEntry = Object.assign({}, entry, {
      entryId: await newEntryId(deviceId, entry.partNumber)
    })
    const result = await asyncBucketUpsert(newEntry.entryId, newEntry)
    res.status(200).send({ result, entryId: newEntry.entryId })
  } catch (error) {
    res.status(400).send({ error: error.message })
  }
})

export default router
