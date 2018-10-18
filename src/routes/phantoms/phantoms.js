import { Router } from "express"
import bodyParser from "body-parser"
import couchbase, { N1qlQuery } from "couchbase"
import flattenDeep from "lodash.flattendeep"
import uuid from "uuid"
import config from "../../../config.json"
import SageX3 from "../../db"
import { getBomd, getItemCategory } from "./phantom-queries"

// Set up couchbase cluster and bucket //
const cbConfig = config.couchbase
const cluster = new couchbase.Cluster(cbConfig.cluster)
cluster.authenticate(cbConfig.username, cbConfig.password)
const bucket = cluster.openBucket(cbConfig.bucket)

const router = Router()

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))

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

const asyncBucketGet = async (id, _bucket = bucket) =>
  new Promise((resolve, reject) => {
    _bucket.get(id, (err, result) => {
      if (err.code === 13) resolve(false)
      else if (err) reject(err)
      else resolve(result)
    })
  })

const newEntryId = async (deviceId, partNumber) => {
  const UUID = uuid()
  const entryId = `${deviceId}-${partNumber}-${UUID.substr(UUID.length - 4, 4)}`
  const result = await asyncBucketGet(entryId)
  if (result) {
    newEntryId(deviceId, partNumber)
  }
  return entryId
}

async function getBom(partNumber, qty) {
  const { recordset } = await SageX3.db.query(getBomd(partNumber, qty))
  return recordset
}

async function isPhantom(partNumber) {
  const { recordset } = await SageX3.db.query(getItemCategory(partNumber))
  const NotAPhantomError = new Error(`${partNumber} is not a phantom or it doesn't exist!`);
  if (!recordset.length) throw NotAPhantomError
  if (recordset[0].itemCategory != "PHANT") {
    throw NotAPhantomError 
  }
  return true
}

async function insertPhantomEntries(bomArray, device, session) {
  const resultArray = await Promise.all(
    bomArray.map(async item => {
      const NOW = new Date().toISOString()
      const { partNumber, qty } = item
      const uploadItem = {
        entryId: await newEntryId(device.deviceId, partNumber),
        createdAt: NOW,
        updatedAt: NOW,
        partNumber,
        qty: parseFloat(qty),
        locationID: "8D",
        type: "entry",
        void: false,
        device,
        session
      }
      const results = await asyncBucketUpsert(uploadItem.entryId, uploadItem)
      return results
    })
  )
  return resultArray
}

// isBottomLevel if true return bomItem
async function isBottomLevel(bomItem) {
  const { partNumber, qty, itemCategory } = bomItem
  const recordset = await getBom(partNumber, qty)
  if (recordset.length && itemCategory === "PHANT") {
    return Promise.all(
      recordset.map(record => {
        return isBottomLevel(record)
      })
    )
  } else {
    return bomItem
  }
}

router.get('/:partNumber', async (req, res) => {
  try {
   const { partNumber } = req.params  
   const result = await isPhantom(partNumber);
   return res.status(200).send({result});
  }catch(error) {
    console.error(error);
    return res.status(400).send({error: error.message})
  }
})

router.post("/entry", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  try {
    const { phantoms, context } = req.body
    if (!phantoms.length)
      return res
        .status(400)
        .send(`The request body must contain an array of phantoms!`)
    const results = await Promise.all(
      phantoms.map(async phantom => {
        const { partNumber, qty } = phantom
        const { device, session } = context
        const recordset = await getBom(partNumber, qty)
        if (!recordset.length) {
          return res
            .status(400)
            .send({ error: `No BOM found for item ${partNumber}!` })
        }
        if ((await isPhantom(partNumber)) === false) {
          return res.status(400).send({
            error: `${partNumber} is not a PHANT category in Sage X3!`
          })
        }
        const multiLevelBom = await Promise.all(
          recordset.map(async record => {
            const bomItem = await isBottomLevel(record)
            return bomItem
          })
        )
        const flattenedBom = flattenDeep(multiLevelBom)
        const resultArray = await insertPhantomEntries(
          flattenedBom,
          device,
          session
        )
        return resultArray
      })
    )
    res.status(200).send({ results })
  } catch (error) {
    console.log(error)
  }
})

export default router
