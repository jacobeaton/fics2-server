"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var getBom = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(partNumber, qty) {
    var _ref5, recordset;

    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return _db2.default.db.query((0, _phantomQueries.getBomd)(partNumber, qty));

          case 2:
            _ref5 = _context4.sent;
            recordset = _ref5.recordset;
            return _context4.abrupt("return", recordset);

          case 5:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function getBom(_x8, _x9) {
    return _ref4.apply(this, arguments);
  };
}();

var isPhantom = function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(partNumber) {
    var _ref7, recordset, NotAPhantomError;

    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return _db2.default.db.query((0, _phantomQueries.getItemCategory)(partNumber));

          case 2:
            _ref7 = _context5.sent;
            recordset = _ref7.recordset;
            NotAPhantomError = new Error(partNumber + " is not a phantom or it doesn't exist!");

            if (recordset.length) {
              _context5.next = 7;
              break;
            }

            throw NotAPhantomError;

          case 7:
            if (!(recordset[0].itemCategory != "PHANT")) {
              _context5.next = 9;
              break;
            }

            throw NotAPhantomError;

          case 9:
            return _context5.abrupt("return", true);

          case 10:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function isPhantom(_x10) {
    return _ref6.apply(this, arguments);
  };
}();

var insertPhantomEntries = function () {
  var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(bomArray, device, session) {
    var _this = this;

    var resultArray;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return Promise.all(bomArray.map(function () {
              var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(item) {
                var NOW, partNumber, qty, uploadItem, results;
                return regeneratorRuntime.wrap(function _callee6$(_context6) {
                  while (1) {
                    switch (_context6.prev = _context6.next) {
                      case 0:
                        NOW = new Date().toISOString();
                        partNumber = item.partNumber, qty = item.qty;
                        _context6.next = 4;
                        return newEntryId(device.deviceId, partNumber);

                      case 4:
                        _context6.t0 = _context6.sent;
                        _context6.t1 = NOW;
                        _context6.t2 = NOW;
                        _context6.t3 = partNumber;
                        _context6.t4 = parseFloat(qty);
                        _context6.t5 = device;
                        _context6.t6 = session;
                        uploadItem = {
                          entryId: _context6.t0,
                          createdAt: _context6.t1,
                          updatedAt: _context6.t2,
                          partNumber: _context6.t3,
                          qty: _context6.t4,
                          locationID: "8W",
                          type: "entry",
                          void: false,
                          device: _context6.t5,
                          session: _context6.t6
                        };
                        _context6.next = 14;
                        return asyncBucketUpsert(uploadItem.entryId, uploadItem);

                      case 14:
                        results = _context6.sent;
                        return _context6.abrupt("return", results);

                      case 16:
                      case "end":
                        return _context6.stop();
                    }
                  }
                }, _callee6, _this);
              }));

              return function (_x14) {
                return _ref9.apply(this, arguments);
              };
            }()));

          case 2:
            resultArray = _context7.sent;
            return _context7.abrupt("return", resultArray);

          case 4:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function insertPhantomEntries(_x11, _x12, _x13) {
    return _ref8.apply(this, arguments);
  };
}();

// isBottomLevel if true return bomItem


var isBottomLevel = function () {
  var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(bomItem) {
    var partNumber, qty, itemCategory, recordset;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            partNumber = bomItem.partNumber, qty = bomItem.qty, itemCategory = bomItem.itemCategory;
            _context8.next = 3;
            return getBom(partNumber, qty);

          case 3:
            recordset = _context8.sent;

            if (!(recordset.length && itemCategory === "PHANT")) {
              _context8.next = 8;
              break;
            }

            return _context8.abrupt("return", Promise.all(recordset.map(function (record) {
              return isBottomLevel(record);
            })));

          case 8:
            return _context8.abrupt("return", bomItem);

          case 9:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function isBottomLevel(_x15) {
    return _ref10.apply(this, arguments);
  };
}();

var _express = require("express");

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _couchbase = require("couchbase");

var _couchbase2 = _interopRequireDefault(_couchbase);

var _lodash = require("lodash.flattendeep");

var _lodash2 = _interopRequireDefault(_lodash);

var _uuid = require("uuid");

var _uuid2 = _interopRequireDefault(_uuid);

var _config = require("../../../config.json");

var _config2 = _interopRequireDefault(_config);

var _db = require("../../db");

var _db2 = _interopRequireDefault(_db);

var _phantomQueries = require("./phantom-queries");

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

var asyncBucketUpsert = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(id, doc) {
    var _bucket = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : bucket;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              _bucket.upsert(id, doc, function (err, result) {
                if (err) reject(err);else {
                  resolve(result);
                }
              });
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function asyncBucketUpsert(_x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var asyncBucketGet = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(id) {
    var _bucket = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : bucket;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt("return", new Promise(function (resolve, reject) {
              _bucket.get(id, function (err, result) {
                if (err.code === 13) resolve(false);else if (err) reject(err);else resolve(result);
              });
            }));

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function asyncBucketGet(_x5) {
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

router.get('/:partNumber', function () {
  var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(req, res) {
    var partNumber, result;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.prev = 0;
            partNumber = req.params.partNumber;
            _context9.next = 4;
            return isPhantom(partNumber);

          case 4:
            result = _context9.sent;
            return _context9.abrupt("return", res.status(200).send({ result: result }));

          case 8:
            _context9.prev = 8;
            _context9.t0 = _context9["catch"](0);

            console.error(_context9.t0);
            return _context9.abrupt("return", res.status(400).send({ error: _context9.t0.message }));

          case 12:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, undefined, [[0, 8]]);
  }));

  return function (_x16, _x17) {
    return _ref11.apply(this, arguments);
  };
}());

router.post("/entry", function () {
  var _ref12 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12(req, res) {
    var _req$body, phantoms, context, results;

    return regeneratorRuntime.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            res.setHeader("Access-Control-Allow-Origin", "*");
            _context12.prev = 1;
            _req$body = req.body, phantoms = _req$body.phantoms, context = _req$body.context;

            if (phantoms.length) {
              _context12.next = 5;
              break;
            }

            return _context12.abrupt("return", res.status(400).send("The request body must contain an array of phantoms!"));

          case 5:
            _context12.next = 7;
            return Promise.all(phantoms.map(function () {
              var _ref13 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(phantom) {
                var partNumber, qty, device, session, recordset, multiLevelBom, flattenedBom, resultArray;
                return regeneratorRuntime.wrap(function _callee11$(_context11) {
                  while (1) {
                    switch (_context11.prev = _context11.next) {
                      case 0:
                        partNumber = phantom.partNumber, qty = phantom.qty;
                        device = context.device, session = context.session;
                        _context11.next = 4;
                        return getBom(partNumber, qty);

                      case 4:
                        recordset = _context11.sent;

                        if (recordset.length) {
                          _context11.next = 7;
                          break;
                        }

                        return _context11.abrupt("return", res.status(400).send({ error: "No BOM found for item " + partNumber + "!" }));

                      case 7:
                        _context11.next = 9;
                        return isPhantom(partNumber);

                      case 9:
                        _context11.t0 = _context11.sent;

                        if (!(_context11.t0 === false)) {
                          _context11.next = 12;
                          break;
                        }

                        return _context11.abrupt("return", res.status(400).send({
                          error: partNumber + " is not a PHANT category in Sage X3!"
                        }));

                      case 12:
                        _context11.next = 14;
                        return Promise.all(recordset.map(function () {
                          var _ref14 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(record) {
                            var bomItem;
                            return regeneratorRuntime.wrap(function _callee10$(_context10) {
                              while (1) {
                                switch (_context10.prev = _context10.next) {
                                  case 0:
                                    _context10.next = 2;
                                    return isBottomLevel(record);

                                  case 2:
                                    bomItem = _context10.sent;
                                    return _context10.abrupt("return", bomItem);

                                  case 4:
                                  case "end":
                                    return _context10.stop();
                                }
                              }
                            }, _callee10, undefined);
                          }));

                          return function (_x21) {
                            return _ref14.apply(this, arguments);
                          };
                        }()));

                      case 14:
                        multiLevelBom = _context11.sent;
                        flattenedBom = (0, _lodash2.default)(multiLevelBom);
                        _context11.next = 18;
                        return insertPhantomEntries(flattenedBom, device, session);

                      case 18:
                        resultArray = _context11.sent;
                        return _context11.abrupt("return", resultArray);

                      case 20:
                      case "end":
                        return _context11.stop();
                    }
                  }
                }, _callee11, undefined);
              }));

              return function (_x20) {
                return _ref13.apply(this, arguments);
              };
            }()));

          case 7:
            results = _context12.sent;

            res.status(200).send({ results: results });
            _context12.next = 14;
            break;

          case 11:
            _context12.prev = 11;
            _context12.t0 = _context12["catch"](1);

            console.log(_context12.t0);

          case 14:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12, undefined, [[1, 11]]);
  }));

  return function (_x18, _x19) {
    return _ref12.apply(this, arguments);
  };
}());

exports.default = router;