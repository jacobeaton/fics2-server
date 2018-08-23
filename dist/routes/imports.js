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

var asyncBucketGet = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(id) {
    var _bucket = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : bucket;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              _bucket.get(id, function (err, result) {
                if (err.code === 13) resolve(false);else if (err) reject(err);else resolve(result);
              });
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function asyncBucketGet(_x2) {
    return _ref.apply(this, arguments);
  };
}();

var asyncBucketUpsert = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(id, doc) {
    var _bucket = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : bucket;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            new Promise(function (resolve, reject) {
              _bucket.upsert(id, doc, function (err, result) {
                if (err) reject(err);else {
                  resolve(result);
                }
              });
            });

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function asyncBucketUpsert(_x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

var newEntryId = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(deviceId, partNumber) {
    var UUID, entryId, result;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            UUID = (0, _uuid2.default)();
            entryId = deviceId + "-" + partNumber + "-" + UUID.substr(UUID.length - 4, 4);
            _context3.next = 4;
            return asyncBucketGet(entryId);

          case 4:
            result = _context3.sent;

            if (result) {
              newEntryId(deviceId, partNumber);
            }
            return _context3.abrupt("return", entryId);

          case 7:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function newEntryId(_x6, _x7) {
    return _ref3.apply(this, arguments);
  };
}();

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
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(filePath) {
    var jsonArray, resultArray;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return (0, _csvtojson2.default)().fromFile(filePath);

          case 2:
            jsonArray = _context5.sent;
            _context5.next = 5;
            return Promise.all(jsonArray.map(function () {
              var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(item) {
                var cost, systemQty, description, uploadItem, results;
                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        cost = item.cost, systemQty = item.systemQty, description = item.description;

                        console.log(item);
                        uploadItem = {
                          cost: parseFloat(cost),
                          systemQty: parseFloat(systemQty),
                          description: cleanStr(description),
                          partNumber: item.partNumber,
                          type: "part",
                          void: false,
                          sessionId: item.sessionId,
                          countList: item.countList,
                          countListLine: item.countListLine,
                          unit: item.unit
                        };
                        _context4.next = 5;
                        return bucket.upsert(uploadItem.partNumber, uploadItem, function (error, result) {
                          return error ? { error: error } : { result: result };
                        });

                      case 5:
                        results = _context4.sent;
                        return _context4.abrupt("return", { partNumber: item.partNumber, results: results });

                      case 7:
                      case "end":
                        return _context4.stop();
                    }
                  }
                }, _callee4, undefined);
              }));

              return function (_x9) {
                return _ref5.apply(this, arguments);
              };
            }()));

          case 5:
            resultArray = _context5.sent;
            return _context5.abrupt("return", resultArray);

          case 7:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  }));

  return function importParts(_x8) {
    return _ref4.apply(this, arguments);
  };
}();

var importEntries = function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(filePath, device, session) {
    var jsonArray, resultArray;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;
            _context7.next = 3;
            return (0, _csvtojson2.default)().fromFile(filePath);

          case 3:
            jsonArray = _context7.sent;
            _context7.next = 6;
            return Promise.all(jsonArray.map(function () {
              var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(item) {
                var NOW, partNumber, qty, locationID, wip, uploadItem, results;
                return regeneratorRuntime.wrap(function _callee6$(_context6) {
                  while (1) {
                    switch (_context6.prev = _context6.next) {
                      case 0:
                        NOW = new Date().toISOString();
                        partNumber = item.partNumber, qty = item.qty, locationID = item.locationID;
                        wip = item.wip;
                        _context6.next = 5;
                        return newEntryId(device.deviceId, wip ? wip : partNumber);

                      case 5:
                        _context6.t0 = _context6.sent;
                        _context6.t1 = NOW;
                        _context6.t2 = NOW;
                        _context6.t3 = partNumber;
                        _context6.t4 = parseFloat(qty);
                        _context6.t5 = locationID;
                        _context6.t6 = device;
                        _context6.t7 = session;
                        uploadItem = {
                          entryId: _context6.t0,
                          createdAt: _context6.t1,
                          updatedAt: _context6.t2,
                          partNumber: _context6.t3,
                          qty: _context6.t4,
                          locationID: _context6.t5,
                          type: "entry",
                          void: false,
                          device: _context6.t6,
                          session: _context6.t7
                        };
                        _context6.next = 16;
                        return asyncBucketUpsert(uploadItem.entryId, uploadItem);

                      case 16:
                        results = _context6.sent;

                        console.log(results);
                        return _context6.abrupt("return", results);

                      case 19:
                      case "end":
                        return _context6.stop();
                    }
                  }
                }, _callee6, undefined);
              }));

              return function (_x13) {
                return _ref7.apply(this, arguments);
              };
            }()));

          case 6:
            resultArray = _context7.sent;
            return _context7.abrupt("return", resultArray);

          case 10:
            _context7.prev = 10;
            _context7.t0 = _context7["catch"](0);

            console.log(_context7.t0);
            throw new Error("Something failed on the entry import");

          case 14:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, undefined, [[0, 10]]);
  }));

  return function importEntries(_x10, _x11, _x12) {
    return _ref6.apply(this, arguments);
  };
}();

router.post("/parts", function (req, res) {
  if (!req.files) {
    res.status(400).send({ error: "No files were uploaded." });
  }
  var upload = req.files.upload;

  upload.mv("./temp/" + upload.name).then(function () {
    var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(error) {
      return regeneratorRuntime.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              if (!error) {
                _context8.next = 2;
                break;
              }

              throw error;

            case 2:
              return _context8.abrupt("return", importParts("./temp/" + upload.name));

            case 3:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8, undefined);
    }));

    return function (_x14) {
      return _ref8.apply(this, arguments);
    };
  }()).then(function (result) {
    res.status(200).send(result);
  }).catch(function (error) {
    res.status(500).send(error);
  });
});

router.post("/entry/:device/:session", function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log(req.files);
  if (!req.files) {
    return res.status(400).send({ error: "No files were uploaded." });
  }
  var upload = req.files.upload;

  var deviceObjString = req.params.device;
  var sessionObjString = req.params.session;
  console.log(deviceObjString);
  console.log(sessionObjString);
  console.log(JSON.parse(decodeURIComponent(deviceObjString)));
  console.log(JSON.parse(decodeURIComponent(sessionObjString)));
  var device = JSON.parse(decodeURIComponent(deviceObjString));
  var session = JSON.parse(decodeURIComponent(sessionObjString));
  upload.mv("./temp/" + upload.name).then(function (error) {
    if (error) {
      throw error;
    }
    return importEntries("./temp/" + upload.name, device, session);
  }).then(function (result) {
    res.status(200).send(result);
  }).catch(function (error) {
    res.status(500).send(error);
  });
});

exports.default = router;