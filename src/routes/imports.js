import { Router } from "express"
import bodyParser from "body-parser"
import couchbase, { N1qlQuery } from "couchbase"
import fileUpload from "express-fileupload"
import csv from "csvtojson"
import uuid from "uuid4"

import config from "../../config.json"

// Set up couchbase cluster and bucket //
const cbConfig = config.couchbase
const cluster = new couchbase.Cluster(cbConfig.cluster)
cluster.authenticate(cbConfig.username, cbConfig.password)
const bucket = cluster.openBucket(cbConfig.bucket)

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

const dev = {
  deviceId: "9001",
  firstName: "Michael",
  lastName: "Powell",
  isActive: true,
  isAuditing: false,
  role: 5,
  type: "device"
}

const sess = {
  auditActive: false,
  collectActive: true,
  sessionDate: "2018-06-07T14:58:08-05:00",
  sessionId: "SCS000022",
  type: "session",
  updatedAt: "2018-08-14T19:28:08-05:00"
}

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
      console.log(item)
      const uploadItem = {
        cost: parseFloat(cost),
        systemQty: parseFloat(systemQty),
        description: cleanStr(description),
        partNumber: item.partNumber,
        type: "part",
        void: false,
        sessionId: item.sessionId,
        countList: item.countList,
        countListLine: item.countListLine,
        unit: item.unit
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

const importEntries = async (filePath, device, session) => {
  try {
    const jsonArray = await csv().fromFile(filePath)
    const resultArray = await Promise.all(
      jsonArray.map(async item => {
        const NOW = new Date().toISOString()
        const { partNumber, qty, locationID } = item
        const uploadItem = {
          entryId: await newEntryId(device.deviceId, partNumber),
          createdAt: NOW,
          updatedAt: NOW,
          partNumber,
          qty: parseFloat(qty),
          locationID,
          type: "entry",
          void: false,
          device,
          session
        }
        const results = await asyncBucketUpsert(uploadItem.entryId, uploadItem)
        console.log(results)
        return results
      })
    )
    return resultArray
  } catch (error) {
    console.log(error)
    throw new Error("Something failed on the entry import")
  }
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
      res.status(200).send(result)
    })
    .catch(error => {
      res.status(500).send(error)
    })
})

router.post("/entry", (req, res) => {
  if (!req.files) {
    res.status(400).send({ error: "No files were uploaded." })
  }
  const { upload } = req.files
  upload
    .mv(`./temp/${upload.name}`)
    .then(error => {
      if (error) {
        throw error
      }
      return importEntries(`./temp/${upload.name}`, dev, sess)
    })
    .then(result => {
      res.status(200).send(result)
    })
    .catch(error => {
      res.status(500).send(error)
    })
})

export default router
