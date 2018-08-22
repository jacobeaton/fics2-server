import { Router } from "express"
import bodyParser from "body-parser"
import couchbase, { N1qlQuery } from "couchbase"
import json2xls from "json2xls"

import config from "../../config.json"

// Set up couchbase cluster and bucket //
const cbConfig = config.couchbase
const cluster = new couchbase.Cluster(cbConfig.cluster)
cluster.authenticate(cbConfig.username, cbConfig.password)
const bucket = cluster.openBucket(cbConfig.bucket)

const router = Router()
router.use(bodyParser.json())
router.use(bodyParser.urlencoded())
router.use(json2xls.middleware)

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
  res.xls("live-variance.xlsx", partsWithEntry)
  res.status(200).send()
})
export default router
