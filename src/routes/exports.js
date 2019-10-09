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
    `SELECT partNumber, description, systemQty, cost FROM fics2 WHERE type="part"`
  )
  const entriesQuery = N1qlQuery.fromString(
    `SELECT partNumber, sum(qty) as counted FROM fics2 where type="entry" and void=false GROUP BY partNumber`
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
    `SELECT partNumber, description, systemQty, cost, sessionId, countList, countListLine, unit FROM fics2 WHERE type="part" ORDER BY partNumber`
  )
  const entriesQuery = N1qlQuery.fromString(
    `SELECT partNumber, sum(qty) as counted FROM fics2 where type="entry" and void=false GROUP BY partNumber`
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
router.get("/entriesFile", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  const entriesQuery = N1qlQuery.fromString(
    `Select * from fics2 where type="entry"`
  )
  const entries = await asyncBucketQuery(entriesQuery)

  const outputData = entries.map(obj => {
    // paylaod comes in with fics2 as top level object property
    // this removes the fics2 property so all we have is the entry itself
    const entry = obj.fics2 
    console.log(obj)
    return (
    {
      createdAt: entry.createdAt,
      deviceId: entry.device ? entry.device.deviceId : "",
      firstName: entry.device ? entry.device.firstName: "",
      lastName: entry.device ? entry.device.lastName: "",
      role: entry.device ? entry.device.role: "",
      deviceType: entry.device ? entry.device.type: "",
      entryId: entry.entryId,
      locationId: entry.locationID,
      partNumber: entry.partNumber,
      qty: entry.qty,
      sessionDate: entry.session ? entry.session.sessionDate : "",
      sessionId: entry.session ? entry.session.sessionId : "",
      type: entry.type,
      updatedAt: entry.updatedAt,
      void: entry.void
    } 
  )})
  res.xls("entriesFile.xlsx", outputData)
  res.status(200).send()
})
export default router
