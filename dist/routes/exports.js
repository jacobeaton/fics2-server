"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require("express");

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _couchbase = require("couchbase");

var _couchbase2 = _interopRequireDefault(_couchbase);

var _json2xls = require("json2xls");

var _json2xls2 = _interopRequireDefault(_json2xls);

var _config = require("../../config.json");

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// Set up couchbase cluster and bucket //
var cbConfig = _config2.default.couchbase;
var cluster = new _couchbase2.default.Cluster(cbConfig.cluster);
cluster.authenticate(cbConfig.username, cbConfig.password);
var bucket = cluster.openBucket(cbConfig.bucket);

var router = (0, _express.Router)();
router.use(_bodyParser2.default.json());
router.use(_bodyParser2.default.urlencoded());
router.use(_json2xls2.default.middleware);

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
            res.setHeader("Access-Control-Allow-Origin", "*");
            partsQuery = _couchbase.N1qlQuery.fromString("SELECT partNumber, description, systemQty, cost FROM fics WHERE type=\"part\"");
            entriesQuery = _couchbase.N1qlQuery.fromString("SELECT partNumber, sum(qty) as counted FROM fics where type=\"entry\" and void=false GROUP BY partNumber");
            _context3.next = 5;
            return asyncBucketQuery(partsQuery);

          case 5:
            parts = _context3.sent;
            _context3.next = 8;
            return asyncBucketQuery(entriesQuery);

          case 8:
            entries = _context3.sent;
            _context3.next = 11;
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

          case 11:
            partsWithEntry = _context3.sent;

            res.xls("live-variance.xlsx", partsWithEntry);
            res.status(200).send();

          case 14:
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
exports.default = router;