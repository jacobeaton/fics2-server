"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require("express");

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _couchbase = require("couchbase");

var _couchbase2 = _interopRequireDefault(_couchbase);

var _expressFileupload = require("express-fileupload");

var _expressFileupload2 = _interopRequireDefault(_expressFileupload);

var _csvtojson = require("csvtojson");

var _csvtojson2 = _interopRequireDefault(_csvtojson);

var _uuid = require("uuid4");

var _uuid2 = _interopRequireDefault(_uuid);

var _config = require("../../config.json");

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// Set up couchbase cluster and bucket //
var cbConfig = _config2.default.couchbase;
var cluster = new _couchbase2.default.Cluster(cbConfig.cluster);
cluster.authenticate(cbConfig.username, cbConfig.password);
var bucket = cluster.openBucket(cbConfig.bucket);

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

var newEntryId = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(deviceId, partNumber) {
    var UUID, entryId, query, result;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            UUID = (0, _uuid2.default)();
            entryId = deviceId + "-" + partNumber + "-" + UUID.substr(UUID.length - 4, 4);
            query = _couchbase.N1qlQuery.fromString("SELECT * FROM fics WHERE entryId=\"" + entryId + "\"");
            _context2.next = 5;
            return asyncBucketQuery(query);

          case 5:
            result = _context2.sent;

            if (result.length > 0) {
              newEntryId(deviceId, partNumber);
            }
            return _context2.abrupt("return", entryId);

          case 8:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function newEntryId(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

var dev = {
  deviceId: "9001",
  firstName: "Michael",
  lastName: "Powell",
  isActive: true,
  isAuditing: false,
  role: 5,
  type: "device"
};

var sess = {
  auditActive: false,
  collectActive: true,
  sessionDate: "2018-06-07T14:58:08-05:00",
  sessionId: "SCS000022",
  type: "session",
  updatedAt: "2018-08-14T19:28:08-05:00"

  // create express.Router() and use bodyParser middleware //
};var router = (0, _express.Router)();
router.use(_bodyParser2.default.json());
router.use(_bodyParser2.default.urlencoded({ extended: true }));
router.use((0, _expressFileupload2.default)());

var cleanStr = function cleanStr(str) {
  return str.replace(/"/, "in").replace(/'/, "ft").replace(/,/, "").substr(0, 100);
};

var importParts = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(filePath) {
    var jsonArray, resultArray;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return (0, _csvtojson2.default)().fromFile(filePath);

          case 2:
            jsonArray = _context4.sent;
            _context4.next = 5;
            return Promise.all(jsonArray.map(function () {
              var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(item) {
                var cost, systemQty, description, uploadItem, results;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        cost = item.cost, systemQty = item.systemQty, description = item.description;
                        uploadItem = {
                          cost: parseFloat(cost),
                          systemQty: parseFloat(systemQty),
                          description: cleanStr(description),
                          partNumber: item.partNumber,
                          type: "part",
                          void: false
                        };
                        _context3.next = 4;
                        return bucket.upsert(uploadItem.partNumber, uploadItem, function (error, result) {
                          return error ? { error: error } : { result: result };
                        });

                      case 4:
                        results = _context3.sent;
                        return _context3.abrupt("return", { partNumber: item.partNumber, results: results });

                      case 6:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3, undefined);
              }));

              return function (_x6) {
                return _ref4.apply(this, arguments);
              };
            }()));

          case 5:
            resultArray = _context4.sent;
            return _context4.abrupt("return", resultArray);

          case 7:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function importParts(_x5) {
    return _ref3.apply(this, arguments);
  };
}();

var importEntries = function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(filePath, device, session) {
    var jsonArray, resultArray;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return (0, _csvtojson2.default)().fromFile(filePath);

          case 2:
            jsonArray = _context6.sent;
            _context6.next = 5;
            return Promise.all(jsonArray.map(function () {
              var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(item) {
                var NOW, partNumber, qty, locationID, uploadItem, results;
                return regeneratorRuntime.wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        NOW = new Date().toISOString();
                        partNumber = item.partNumber, qty = item.qty, locationID = item.locationID;
                        _context5.next = 4;
                        return newEntryId(device.deviceId, partNumber);

                      case 4:
                        _context5.t0 = _context5.sent;
                        _context5.t1 = NOW;
                        _context5.t2 = NOW;
                        _context5.t3 = partNumber;
                        _context5.t4 = parseFloat(qty);
                        _context5.t5 = locationID;
                        _context5.t6 = device;
                        _context5.t7 = session;
                        uploadItem = {
                          entryId: _context5.t0,
                          createdAt: _context5.t1,
                          updatedAt: _context5.t2,
                          partNumber: _context5.t3,
                          qty: _context5.t4,
                          locationID: _context5.t5,
                          type: "entry",
                          void: false,
                          device: _context5.t6,
                          session: _context5.t7
                        };
                        _context5.next = 15;
                        return bucket.upsert(uploadItem.entryId, uploadItem, function (error, result) {
                          return error ? { error: error } : { result: result };
                        });

                      case 15:
                        results = _context5.sent;
                        return _context5.abrupt("return", { entryId: item.entryId, results: results });

                      case 17:
                      case "end":
                        return _context5.stop();
                    }
                  }
                }, _callee5, undefined);
              }));

              return function (_x10) {
                return _ref6.apply(this, arguments);
              };
            }()));

          case 5:
            resultArray = _context6.sent;
            return _context6.abrupt("return", resultArray);

          case 7:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, undefined);
  }));

  return function importEntries(_x7, _x8, _x9) {
    return _ref5.apply(this, arguments);
  };
}();

router.post("/parts", function (req, res) {
  if (!req.files) {
    res.status(400).send({ error: "No files were uploaded." });
  }
  var upload = req.files.upload;

  upload.mv("./temp/" + upload.name).then(function () {
    var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(error) {
      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              if (!error) {
                _context7.next = 2;
                break;
              }

              throw error;

            case 2:
              return _context7.abrupt("return", importParts("./temp/" + upload.name));

            case 3:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7, undefined);
    }));

    return function (_x11) {
      return _ref7.apply(this, arguments);
    };
  }()).then(function (result) {
    res.status(200).send({ result: result });
  }).catch(function (error) {
    res.status(500).send({ error: error });
  });
});

router.post("/entry", function () {
  var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(req, res) {
    var upload, error, results;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            if (!req.files) {
              res.status(400).send({ error: "No files were uploaded." });
            }
            upload = req.files.upload;
            _context8.prev = 2;
            _context8.next = 5;
            return upload.mv("./temp/" + upload.name);

          case 5:
            error = _context8.sent;

            if (!error) {
              _context8.next = 8;
              break;
            }

            throw error;

          case 8:
            _context8.next = 10;
            return importEntries("./temp/" + upload.name, dev, sess);

          case 10:
            results = _context8.sent;

            res.status(200).send({ results: results });
            _context8.next = 17;
            break;

          case 14:
            _context8.prev = 14;
            _context8.t0 = _context8["catch"](2);

            res.status(500).send({ error: _context8.t0 });

          case 17:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, undefined, [[2, 14]]);
  }));

  return function (_x12, _x13) {
    return _ref8.apply(this, arguments);
  };
}());

exports.default = router;