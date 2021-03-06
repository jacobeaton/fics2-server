"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

require("babel-polyfill");

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _cors = require("cors");

var _cors2 = _interopRequireDefault(_cors);

var _config = require("../config");

var _config2 = _interopRequireDefault(_config);

var _routes = require("./routes/routes");

var _routes2 = _interopRequireDefault(_routes);

var _imports = require("./routes/imports");

var _imports2 = _interopRequireDefault(_imports);

var _exports = require("./routes/exports");

var _exports2 = _interopRequireDefault(_exports);

var _entry = require("./routes/entry");

var _entry2 = _interopRequireDefault(_entry);

var _auth = require("./routes/auth");

var _auth2 = _interopRequireDefault(_auth);

var _phantoms = require("./routes/phantoms/phantoms");

var _phantoms2 = _interopRequireDefault(_phantoms);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

app.use((0, _cors2.default)());
app.use("/api", _routes2.default);
app.use("/imports", _imports2.default);
app.use("/exports", _exports2.default);
app.use("/auth", _auth2.default);
app.use("/phantoms", _phantoms2.default);
app.use("/entry", _entry2.default);

app.listen(_config2.default.express.port, function () {
  console.log("Server is listening on port " + _config2.default.express.port + "...");
});

exports.default = app;