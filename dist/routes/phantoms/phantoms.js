"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var getBom = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(partNumber, qty) {
    var _ref2, recordset;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _db2.default.db.query((0, _phantomQueries.getBomd)(partNumber, qty));

          case 2:
            _ref2 = _context.sent;
            recordset = _ref2.recordset;
            return _context.abrupt("return", recordset);

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getBom(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

// isBottomLevel if true return bomItem


var isBottomLevel = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(bomItem) {
    var partNumber, qty, recordset, nextLevelRecordSet;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            partNumber = bomItem.partNumber, qty = bomItem.qty;
            _context2.next = 3;
            return getBom(partNumber, qty);

          case 3:
            recordset = _context2.sent;

            if (!recordset.length) {
              _context2.next = 10;
              break;
            }

            _context2.next = 7;
            return recordset.map(function (record) {
              return isBottomLevel(record);
            });

          case 7:
            nextLevelRecordSet = _context2.sent;
            _context2.next = 11;
            break;

          case 10:
            return _context2.abrupt("return", bomItem);

          case 11:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function isBottomLevel(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

var _express = require("express");

var _bodyParser = require("body-parser");

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _couchbase = require("couchbase");

var _couchbase2 = _interopRequireDefault(_couchbase);

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

router.post("/entry", function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(req, res) {
    var _req$body$phantom, partNumber, qty, recordset, multiLevelBom;

    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _req$body$phantom = req.body.phantom, partNumber = _req$body$phantom.partNumber, qty = _req$body$phantom.qty;
            _context3.next = 4;
            return getBom(partNumber, qty);

          case 4:
            recordset = _context3.sent;
            _context3.next = 7;
            return recordset.map(function (record) {
              return isBottomLevel(record);
            });

          case 7:
            multiLevelBom = _context3.sent;

            res.status(200).send({ multiLevelBom: multiLevelBom });
            _context3.next = 14;
            break;

          case 11:
            _context3.prev = 11;
            _context3.t0 = _context3["catch"](0);

            console.log(_context3.t0);

          case 14:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, undefined, [[0, 11]]);
  }));

  return function (_x4, _x5) {
    return _ref4.apply(this, arguments);
  };
}());

exports.default = router;