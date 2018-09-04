import { Router } from "express"
import bodyParser from "body-parser"
import couchbase, { N1qlQuery } from "couchbase"
import json2xls from "json2xls"
import fs from "fs"
import flatten from "lodash.flatten"
import { parse } from "json2csv"
import appRoot from "app-root-path"

import config from "../../config.json"

// Set up couchbase cluster and bucket //
const cbConfig = config.couchbase
const cluster = new couchbase.Cluster(cbConfig.cluster)
cluster.authenticate(cbConfig.username, cbConfig.password)
const bucket = cluster.openBucket(cbConfig.bucket)

const router = Router()
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
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

router.get("/x3file", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  const partsQuery = N1qlQuery.fromString(
    `SELECT partNumber, description, systemQty, cost, sessionId, countList, countListLine, unit FROM fics WHERE type="part" ORDER BY partNumber`
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
      const result = {
        s: `S`,
        sessionId: `${part.sessionId}`,
        countList: `${part.countList}`,
        countListLine: `${part.countListLine}`,
        site: `015`,
        counted: counted,
        counted2: counted,
        isZero: counted === 0 ? 2 : 1,
        partNumber: `${part.partNumber}`,
        blank: ``,
        blank2: ``,
        location: `01`,
        class: `A`,
        unit: `${part.unit}`,
        always1: `1`,
      }
      return result
    })
  )
  fs.writeFile(
    "temp/x3import.csv",
    parse(flatten(partsWithEntry), { header: false, eol: '\r\n' }),
    err => {
      if (err) return res.status(500).send(err)
      return res
        .status(200)
        .download(`${appRoot}/temp/x3import.csv`, "x3import.csv")
    }
  )
})
export default router
