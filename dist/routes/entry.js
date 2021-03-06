"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require("express");

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _couchbase = require("couchbase");

var _couchbase2 = _interopRequireDefault(_couchbase);

var _uuid = require("uuid4");

var _uuid2 = _interopRequireDefault(_uuid);

var _config = require("../../config.json");

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // @format


// Set up couchbase cluster and bucket //
var cbConfig = _config2.default.couchbase;
var cluster = new _couchbase2.default.Cluster(cbConfig.cluster);
cluster.authenticate(cbConfig.username, cbConfig.password);
var bucket = cluster.openBucket(cbConfig.bucket);

// create express.Router() and use bodyParser middleware //
var router = (0, _express.Router)();
router.use(_bodyParser2.default.json());
router.use(_bodyParser2.default.urlencoded({ extended: true }));

var asyncBucketGet = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(id) {
    var _bucket = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : bucket;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              _bucket.get(id, function (err, result) {
                if (err) {
                  if (err.code === 13) resolve(false);else reject(err);
                } else resolve(result);
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
            return _context2.abrupt("return", new Promise(function (resolve, reject) {
              _bucket.upsert(id, doc, function (err, result) {
                if (err) reject(err);else {
                  resolve(result);
                }
              });
            }));

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

router.get("/:id", function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(req, res) {
    var result;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            console.log(req.params);
            _context4.next = 3;
            return asyncBucketGet(req.params.id);

          case 3:
            result = _context4.sent;

            console.log(result);
            return _context4.abrupt("return", res.status(200).send({ result: result }));

          case 6:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function (_x8, _x9) {
    return _ref4.apply(this, arguments);
  };
}());

router.post("/new", function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(req, res) {
    var _req$body, entry, deviceId, newEntry, result;

    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;
            _req$body = req.body, entry = _req$body.entry, deviceId = _req$body.deviceId;

            if (!(!entry || !deviceId)) {
              _context5.next = 4;
              break;
            }

            throw new Error("The request must have entry and deviceId properties on the request body.");

          case 4:
            _context5.t0 = Object;
            _context5.t1 = {};
            _context5.t2 = entry;
            _context5.next = 9;
            return newEntryId(deviceId, entry.partNumber);

          case 9:
            _context5.t3 = _context5.sent;
            _context5.t4 = {
              entryId: _context5.t3
            };
            newEntry = _context5.t0.assign.call(_context5.t0, _context5.t1, _context5.t2, _context5.t4);
            _context5.next = 14;
            return asyncBucketUpsert(newEntry.entryId, newEntry);

          case 14:
            result = _context5.sent;

            res.status(200).send({ result: result, entryId: newEntry.entryId });
            _context5.next = 21;
            break;

          case 18:
            _context5.prev = 18;
            _context5.t5 = _context5["catch"](0);

            res.status(400).send({ error: _context5.t5.message });

          case 21:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, undefined, [[0, 18]]);
  }));

  return function (_x10, _x11) {
    return _ref5.apply(this, arguments);
  };
}());

exports.default = router;