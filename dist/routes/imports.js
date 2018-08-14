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

// create express.Router() and use bodyParser middleware //
var router = (0, _express.Router)();
router.use(_bodyParser2.default.json());
router.use(_bodyParser2.default.urlencoded({ extended: true }));
router.use((0, _expressFileupload2.default)());

var cleanStr = function cleanStr(str) {
  return str.replace(/"/, "in").replace(/'/, "ft").replace(/,/, "").substr(0, 100);
};

var importParts = function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(filePath) {
    var jsonArray, resultArray;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _csvtojson2.default)().fromFile(filePath);

          case 2:
            jsonArray = _context3.sent;
            _context3.next = 5;
            return Promise.all(jsonArray.map(function () {
              var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(item) {
                var cost, systemQty, description, uploadItem, results;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
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
                        _context2.next = 4;
                        return bucket.upsert(uploadItem.partNumber, uploadItem, function (error, result) {
                          return error ? { error: error } : { result: result };
                        });

                      case 4:
                        results = _context2.sent;
                        return _context2.abrupt("return", { partNumber: item.partNumber, results: results });

                      case 6:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2, undefined);
              }));

              return function (_x4) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 5:
            resultArray = _context3.sent;
            return _context3.abrupt("return", resultArray);

          case 7:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function importParts(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

router.post("/parts", function (req, res) {
  if (!req.files) {
    res.status(400).send({ error: "No files were uploaded." });
  }
  var upload = req.files.upload;

  upload.mv("./temp/" + upload.name).then(function () {
    var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(error) {
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (!error) {
                _context4.next = 2;
                break;
              }

              throw error;

            case 2:
              return _context4.abrupt("return", importParts("./temp/" + upload.name));

            case 3:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, undefined);
    }));

    return function (_x5) {
      return _ref4.apply(this, arguments);
    };
  }()).then(function (result) {
    res.status(200).send({ result: result });
  }).catch(function (error) {
    console.log(error);
    res.status(500).send({ error: error });
  });
});

exports.default = router;