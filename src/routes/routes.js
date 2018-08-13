import { Router } from "express"
import bodyParser from "body-parser"
import couchbase, { N1qlQuery } from "couchbase"
import axios from "axios"

import config from "../../.config.json"
var RateLimit = require('express-rate-limit');



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
  const entriesQuery = N1qlQuery.fromString( statement )

  console.log(entriesQuery)

  bucket.query(entriesQuery, (error, result) => {

    res.setHeader("Access-Control-Allow-Origin", "*");
    if (error) {
     
      console.log("error: "+ error)
      return res.status(500).send({ couchbase: error })
    }
    console.log("result: " + result)
    return res.status(200).send({ couchbase: result })
  })
})






// End GET paths //

//** Dont Use UPSERT, as it creates new documents */

router.put("/upsert", async (req, res) => {


  if(req.body.testKey ){
    console.log(req.body.testKey)
  }

  if (!req.body._id) {
    return res.status(500).send({ error: "No _id specified in request body." })
  }

  

  const document = req.body


  bucket.upsert(req.body._id, document,(error, response) => {
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
