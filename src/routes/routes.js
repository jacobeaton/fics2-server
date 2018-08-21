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

/*
var limiter = new RateLimit({
  windowMs: 15*60*1000, // 15 minutes
  max: 10000, // limit each IP to 100 requests per windowMs
  delayMs: 0 // disable delaying - full speed until the max limit is reached
});

router.use(limiter)
*/

// Start GET paths //
router.get("/", (req, res) => {
  res.status(200).send({ message: "It works!", error: "Error" })
})

router.get("/query", (req, res) => {
  const { statement } = req.query
  const entriesQuery = N1qlQuery.fromString(statement)

  console.log(entriesQuery)

  bucket.query(entriesQuery, (error, result) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    if (error) {
      console.log(`error: ${error}`)
      return res.status(500).send({ error })
    }
    console.log(`result: ${result}`)
    return res.status(200).send({ result })
  })
})
const asyncBucketQuery = async (query, _bucket = bucket) =>
  new Promise((resolve, reject) => {
    _bucket.query(query, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })

router.get("/variance", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  const partsQuery = N1qlQuery.fromString(
    `SELECT partNumber, description, systemQty, cost FROM fics WHERE type="part"`
  )
  const entriesQuery = N1qlQuery.fromString(
    `SELECT partNumber, sum(qty) as counted FROM fics where type="entry" and void=false GROUP BY partNumber`
  )
  const parts = await asyncBucketQuery(partsQuery)
  const entries = await asyncBucketQuery(entriesQuery)
  const partsWithEntry = await Promise.all(
    parts.map(async part => {
      const filteredEntries = await Promise.all(
        entries.filter(entry => entry.partNumber === part.partNumber)
      )
      const counted = filteredEntries.length ? filteredEntries[0].counted : 0
      const variance = counted - part.systemQty
      const extVariance = variance * part.cost
      const result = {
        PartNum: part.partNumber,
        Description: part.description,
        SystemQty: part.systemQty,
        Counted: counted,
        Variance: variance,
        Cost: part.cost,
        ExtendedVariance: extVariance
      }
      return result
    })
  )
  res.status(200).send({ result: partsWithEntry })
})

router.get("/variance/:limit", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  const { limit } = req.params
  const partsQuery = N1qlQuery.fromString(
    `SELECT partNumber, description, systemQty, cost FROM fics WHERE type="part"`
  )
  const entriesQuery = N1qlQuery.fromString(
    `SELECT partNumber, sum(qty) as counted FROM fics where type="entry" and void=false GROUP BY partNumber`
  )
  const parts = await asyncBucketQuery(partsQuery)
  const entries = await asyncBucketQuery(entriesQuery)
  const partsWithEntry = await Promise.all(
    parts.map(async part => {
      const filteredEntries = await Promise.all(
        entries.filter(entry => entry.partNumber === part.partNumber)
      )
      const counted = filteredEntries.length ? filteredEntries[0].counted : 0
      const variance = counted - part.systemQty
      const extVariance = variance * part.cost
      const result = {
        PartNum: part.partNumber,
        Description: part.description,
        SystemQty: part.systemQty,
        Counted: counted,
        Variance: variance,
        Cost: part.cost,
        ExtendedVariance: extVariance
      }
      return result
    })
  )
  const sortedPartsWithEntry = partsWithEntry.sort(
    (a, b) => Math.abs(b.ExtendedVariance) - Math.abs(a.ExtendedVariance)
  )
  res.status(200).send({ result: sortedPartsWithEntry.slice(0, limit) })
})
// End GET paths //

//* * Dont Use UPSERT, as it creates new documents */

router.put("/upsert", async (req, res) => {
  if (req.body.testKey) {
    console.log(req.body.testKey)
  }

  if (!req.body._id) {
    return res.status(500).send({ error: "No _id specified in request body." })
  }

  const document = req.body

  bucket.upsert(req.body._id, document, (error, response) => {
    if (error) {
      return res.status(500).send(error.message)
    }
    console.log(response)
  })

  return res.status(200).send(res.data)
})

/*
router.put("/doc/save/", async (req, res) => {
  if (!req.body._id) {
    return res.status(500).send({ error: "No _id specified in request body." })
  }
  const document = req.body
  const response = await axios.put(
    `${config.sync_gateway}/${req.body._id}`,
    document
  )
  return res.status(response.status).send(response.data)
})



router.put("/doc/update/", async (req, res) => {
  if (!req.body._id || !req.body._rev) {
    return res
      .status(500)
      .send("Request body is missing _id or _rev cannot update document.")
  }
  const document = req.body
  const response = await axios.put(
    `${config.sync_gateway}/${req.body._id}?rev=${req.body._rev}`,
    document
  )
 

  return res.status(response.status).send(response.data)
})

*/

export default router
