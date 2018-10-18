import { Router } from "express"
import bodyParser from "body-parser"
import couchbase, { N1qlQuery } from "couchbase"

import config from "../../../config.json"
import SageX3 from "../../db"
import { getBomd } from "./phantom-queries"

// Set up couchbase cluster and bucket //
const cbConfig = config.couchbase
const cluster = new couchbase.Cluster(cbConfig.cluster)
cluster.authenticate(cbConfig.username, cbConfig.password)
const bucket = cluster.openBucket(cbConfig.bucket)

const router = Router()

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))

async function getBom(partNumber, qty) {
  const { recordset } = await SageX3.db.query(getBomd(partNumber, qty))
  return recordset
}

// isBottomLevel if true return bomItem
async function isBottomLevel(bomItem) {
  const { partNumber, qty } = bomItem
  const recordset = await getBom(partNumber, qty)
  if (recordset.length) {
    const nextLevelRecordSet = await recordset.map(record => {
      return isBottomLevel(record)
    })
  } else {
    return bomItem
  }
}

router.post("/entry", async (req, res) => {
  try {
    const { partNumber, qty } = req.body.phantom
    const recordset = await getBom(partNumber, qty)
    const multiLevelBom = await recordset.map(record => {
      return isBottomLevel(record)
    })
    res.status(200).send({ multiLevelBom })
  } catch (error) {
    console.log(error)
  }
})

export default router
