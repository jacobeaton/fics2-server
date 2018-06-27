'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('babel-polyfill');

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _config = require('../.config');

var _config2 = _interopRequireDefault(_config);

var _routes = require('./routes/routes');

var _routes2 = _interopRequireDefault(_routes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

app.use('/api', _routes2.default);
app.listen(_config2.default.express.port, function () {
  console.log('Server is listening on port ' + _config2.default.express.port + '...');
});

exports.default = app;