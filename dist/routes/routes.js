"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require("express");

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _couchbase = require("couchbase");

var _couchbase2 = _interopRequireDefault(_couchbase);

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

var _config = require("../../.config.json");

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

// Start GET paths //
router.get("/", function (req, res) {
  res.status(200).send({ message: "It works!", error: "fixed" });
});

router.get("/entry", function (req, res) {
  var entriesQuery = _couchbase.N1qlQuery.fromString('SELECT * FROM fics WHERE type="entry"');
  bucket.query(entriesQuery, function (error, result) {
    if (error) {
      return res.status(400).send({ error: error });
    }
    return res.status(200).send({ result: result });
  });
});
router.get("/doc", function (req, res) {
  var _req$query = req.query,
      where = _req$query.where,
      groupBy = _req$query.groupBy,
      select = _req$query.select,
      orderBy = _req$query.orderBy;

  var entriesQuery = _couchbase.N1qlQuery.fromString("SELECT " + select + " FROM fics " + (where ? "WHERE " + where : "") + " " + (groupBy ? "GROUP BY " + groupBy : "") + " " + (orderBy ? "ORDER BY " + orderBy : "") + " ");
  console.log(entriesQuery);
  bucket.query(entriesQuery, function (error, result) {
    if (error) {
      return res.status(500).send({ error: error });
    }
    return res.status(200).send({ result: result });
  });
});
// End GET paths //

router.put("/doc/save/", function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {
    var document, response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            document = req.body;
            _context.next = 3;
            return _axios2.default.put(_config2.default.sync_gateway + "/" + req.body._id, document);

          case 3:
            response = _context.sent;
            return _context.abrupt("return", res.status(response.status).send(response.data));

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());

router.put("/doc/update/", function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req, res) {
    var document, response;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            document = req.body;
            _context2.next = 3;
            return _axios2.default.put(_config2.default.sync_gateway + "/" + req.body._id + "?rev=" + req.body._rev, document);

          case 3:
            response = _context2.sent;
            return _context2.abrupt("return", res.status(response.status).send(response.data));

          case 5:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function (_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}());

exports.default = router;