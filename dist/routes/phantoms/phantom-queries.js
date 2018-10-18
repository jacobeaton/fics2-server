"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var getBomd = exports.getBomd = function getBomd(itmref, qty) {
  return "\n  SELECT CPNITMREF_0 as partNumber, BOMQTY_0 * " + qty + " as qty \n  FROM BOMD\n  WHERE ITMREF_0 = '" + itmref + "'\n";
};