import { Router } from "express"
import bodyParser from "body-parser"
import couchbase, { N1qlQuery } from "couchbase"
import axios from "axios"

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

// Start GET paths //
router.get("/", (req, res) => {
  res.status(200).send({ message: "It works!", error: "fixed" })
})

router.get("/doc", (req, res) => {
  const { where, groupBy, select, orderBy } = req.query
  const entriesQuery = N1qlQuery.fromString(
    `SELECT ${select} FROM fics ${where ? `WHERE ${where}` : ""} ${
      groupBy ? `GROUP BY ${groupBy}` : ""
    } ${orderBy ? `ORDER BY ${orderBy}` : ""} `
  )
  console.log(entriesQuery)
  bucket.query(entriesQuery, (error, result) => {
    if (error) {
      return res.status(500).send({ error })
    }
    return res.status(200).send({ result })
  })
})
// End GET paths //
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

export default router
