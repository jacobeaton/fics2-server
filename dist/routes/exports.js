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

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require("lodash.flatten");

var _lodash2 = _interopRequireDefault(_lodash);

var _json2csv = require("json2csv");

var _appRootPath = require("app-root-path");

var _appRootPath2 = _interopRequireDefault(_appRootPath);

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
router.use(_bodyParser2.default.urlencoded({ extended: true }));
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
            partsQuery = _couchbase.N1qlQuery.fromString("SELECT partNumber, description, systemQty, cost FROM fics2 WHERE type=\"part\"");
            entriesQuery = _couchbase.N1qlQuery.fromString("SELECT partNumber, sum(qty) as counted FROM fics2 where type=\"entry\" and void=false GROUP BY partNumber");
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

router.get("/x3file", function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(req, res) {
    var partsQuery, entriesQuery, parts, entries, partsWithEntry;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            res.setHeader("Access-Control-Allow-Origin", "*");
            partsQuery = _couchbase.N1qlQuery.fromString("SELECT partNumber, description, systemQty, cost, sessionId, countList, countListLine, unit FROM fics2 WHERE type=\"part\" ORDER BY partNumber");
            entriesQuery = _couchbase.N1qlQuery.fromString("SELECT partNumber, sum(qty) as counted FROM fics2 where type=\"entry\" and void=false GROUP BY partNumber");
            _context5.next = 5;
            return asyncBucketQuery(partsQuery);

          case 5:
            parts = _context5.sent;
            _context5.next = 8;
            return asyncBucketQuery(entriesQuery);

          case 8:
            entries = _context5.sent;
            _context5.next = 11;
            return Promise.all(parts.map(function () {
              var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(part) {
                var filteredEntries, counted, result;
                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        _context4.next = 2;
                        return Promise.all(entries.filter(function (entry) {
                          return entry.partNumber === part.partNumber;
                        }));

                      case 2:
                        filteredEntries = _context4.sent;
                        counted = filteredEntries.length ? filteredEntries[0].counted : 0;
                        result = {
                          s: "S",
                          sessionId: "" + part.sessionId,
                          countList: "" + part.countList,
                          countListLine: "" + part.countListLine,
                          site: "015",
                          counted: counted,
                          counted2: counted,
                          isZero: counted === 0 ? 2 : 1,
                          partNumber: "" + part.partNumber,
                          blank: "",
                          blank2: "",
                          location: "01",
                          class: "A",
                          unit: "" + part.unit,
                          always1: "1"
                        };
                        return _context4.abrupt("return", result);

                      case 6:
                      case "end":
                        return _context4.stop();
                    }
                  }
                }, _callee4, undefined);
              }));

              return function (_x8) {
                return _ref5.apply(this, arguments);
              };
            }()));

          case 11:
            partsWithEntry = _context5.sent;

            _fs2.default.writeFile("temp/x3import.csv", (0, _json2csv.parse)((0, _lodash2.default)(partsWithEntry), { header: false, eol: '\r\n' }), function (err) {
              if (err) return res.status(500).send(err);
              return res.status(200).download(_appRootPath2.default + "/temp/x3import.csv", "x3import.csv");
            });

          case 13:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  }));

  return function (_x6, _x7) {
    return _ref4.apply(this, arguments);
  };
}());
router.get("/entriesFile", function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(req, res) {
    var entriesQuery, entries, outputData;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            res.setHeader("Access-Control-Allow-Origin", "*");
            entriesQuery = _couchbase.N1qlQuery.fromString("Select * from fics2 where type=\"entry\"");
            _context6.next = 4;
            return asyncBucketQuery(entriesQuery);

          case 4:
            entries = _context6.sent;
            outputData = entries.map(function (obj) {
              // paylaod comes in with fics2 as top level object property
              // this removes the fics2 property so all we have is the entry itself
              var entry = obj.fics2;
              console.log(obj);
              return {
                createdAt: entry.createdAt,
                deviceId: entry.device ? entry.device.deviceId : "",
                firstName: entry.device ? entry.device.firstName : "",
                lastName: entry.device ? entry.device.lastName : "",
                role: entry.device ? entry.device.role : "",
                deviceType: entry.device ? entry.device.type : "",
                entryId: entry.entryId,
                locationId: entry.locationID,
                partNumber: entry.partNumber,
                qty: entry.qty,
                sessionDate: entry.session ? entry.session.sessionDate : "",
                sessionId: entry.session ? entry.session.sessionId : "",
                type: entry.type,
                updatedAt: entry.updatedAt,
                void: entry.void
              };
            });

            res.xls("entriesFile.xlsx", outputData);
            res.status(200).send();

          case 8:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, undefined);
  }));

  return function (_x9, _x10) {
    return _ref6.apply(this, arguments);
  };
}());
exports.default = router;