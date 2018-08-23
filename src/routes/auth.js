import { Router } from "express"
import bodyParser from "body-parser"
import couchbase, { N1qlQuery } from "couchbase"

import config from "../../config.json"

// Set up couchbase cluster and bucket //
const cbConfig = config.couchbase
const cluster = new couchbase.Cluster(cbConfig.cluster)
cluster.authenticate(cbConfig.username, cbConfig.password)
const bucket = cluster.openBucket(cbConfig.bucket)

const asyncBucketGet = async (id, _bucket = bucket) =>
  new Promise((resolve, reject) => {
    _bucket.get(id, (err, result) => {
      if (err) {
        if (err.code === 13) resolve(false)
        else reject(err)
      } else resolve(result)
    })
  })

const router = Router()
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))

router.get("/login/:id", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  const { id } = req.params
  try {
    const result = await asyncBucketGet(id)
    console.log(result.value)
    return res.status(200).send(result)
  } catch (error) {
    return res.status(500).send(error)
  }
})

export default router