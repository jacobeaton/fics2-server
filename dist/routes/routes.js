"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require("express");

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _couchbase = require("couchbase");

var _couchbase2 = _interopRequireDefault(_couchbase);

var _config = require("../../config.json");

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// Set up couchbase cluster and bucket //
var cbConfig = _config2.default.couchbase;
var cluster = new _couchbase2.default.Cluster(cbConfig.cluster);
cluster.authenticate(cbConfig.username, cbConfig.password);
var bucket = cluster.openBucket(cbConfig.bucket);

// create express.Router() and use bodyParser middleware //
var router = (0, _express.Router)();
router.use(_bodyParser2.default.json());
router.use(_bodyParser2.default.urlencoded({ extended: true }));

/*
var limiter = new RateLimit({
  windowMs: 15*60*1000, // 15 minutes
  max: 10000, // limit each IP to 100 requests per windowMs
  delayMs: 0 // disable delaying - full speed until the max limit is reached
});

router.use(limiter)
*/

// Start GET paths //
router.get("/", function (req, res) {
  res.status(200).send({ message: "It works!", error: "Error" });
});

router.get("/query", function (req, res) {
  var statement = req.query.statement;

  var entriesQuery = _couchbase.N1qlQuery.fromString(statement);

  console.log(entriesQuery);

  bucket.query(entriesQuery, function (error, result) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (error) {
      console.log("error: " + error);
      return res.status(500).send({ couchbase: error });
    }
    console.log("result: " + result);
    return res.status(200).send({ couchbase: result });
  });
});
var asyncBucketQuery = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(query) {
    var _bucket = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : bucket;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              _bucket.query(query, function (err, result) {
                if (err) reject(err);else resolve(result);
              });
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function asyncBucketQuery(_x2) {
    return _ref.apply(this, arguments);
  };
}();

router.get("/variance", function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(req, res) {
    var partsQuery, entriesQuery, parts, entries, partsWithEntry;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            partsQuery = _couchbase.N1qlQuery.fromString("SELECT partNumber, description, systemQty, cost FROM fics WHERE type=\"part\"");
            entriesQuery = _couchbase.N1qlQuery.fromString("SELECT partNumber, sum(qty) as counted FROM fics where type=\"entry\" and void=false GROUP BY partNumber");
            _context3.next = 4;
            return asyncBucketQuery(partsQuery);

          case 4:
            parts = _context3.sent;
            _context3.next = 7;
            return asyncBucketQuery(entriesQuery);

          case 7:
            entries = _context3.sent;
            _context3.next = 10;
            return Promise.all(parts.map(function () {
              var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(part) {
                var filteredEntries, counted, variance, extVariance, result;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        _context2.next = 2;
                        return Promise.all(entries.filter(function (entry) {
                          return entry.partNumber === part.partNumber;
                        }));

                      case 2:
                        filteredEntries = _context2.sent;
                        counted = filteredEntries.length ? filteredEntries[0].counted : 0;
                        variance = counted - part.systemQty;
                        extVariance = variance * part.cost;
                        result = {
                          PartNum: part.partNumber,
                          Description: part.description,
                          SystemQty: part.systemQty,
                          Counted: counted,
                          Variance: variance,
                          Cost: part.cost,
                          ExtendedVariance: extVariance
                        };
                        return _context2.abrupt("return", result);

                      case 8:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2, undefined);
              }));

              return function (_x5) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 10:
            partsWithEntry = _context3.sent;

            console.log(partsWithEntry);

          case 12:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function (_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}());

// End GET paths //

//* * Dont Use UPSERT, as it creates new documents */

router.put("/upsert", function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(req, res) {
    var document;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (req.body.testKey) {
              console.log(req.body.testKey);
            }

            if (req.body._id) {
              _context4.next = 3;
              break;
            }

            return _context4.abrupt("return", res.status(500).send({ error: "No _id specified in request body." }));

          case 3:
            document = req.body;


            bucket.upsert(req.body._id, document, function (error, response) {
              if (error) {
                return res.status(500).send(error.message);
              }
              console.log(response);
            });

            return _context4.abrupt("return", res.status(200).send(res.data));

          case 6:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function (_x6, _x7) {
    return _ref4.apply(this, arguments);
  };
}());

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

exports.default = router;