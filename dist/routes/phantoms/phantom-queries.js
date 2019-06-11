"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var getBomd = exports.getBomd = function getBomd(itmref, qty) {
  return "\n  SELECT BOD.CPNITMREF_0 as partNumber, BOD.BOMQTY_0 * " + qty + " as qty, ITM.TCLCOD_0 as itemCategory\n  FROM PROD.BOMD BOD\n  INNER JOIN PROD.ITMMASTER ITM\n  ON BOD.CPNITMREF_0 = ITM.ITMREF_0\n  WHERE BOD.ITMREF_0 = '" + itmref + "'\n";
};
var getItemCategory = exports.getItemCategory = function getItemCategory(itmref) {
  return "\n  SELECT ITMREF_0 as partNumber, TCLCOD_0 as itemCategory\n  FROM PROD.ITMMASTER\n  WHERE ITMREF_0 = '" + itmref + "'\n";
};