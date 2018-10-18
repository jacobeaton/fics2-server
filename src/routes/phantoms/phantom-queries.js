export const getBomd = (itmref, qty) => `
  SELECT BOD.CPNITMREF_0 as partNumber, BOD.BOMQTY_0 * ${qty} as qty, ITM.TCLCOD_0 as itemCategory
  FROM BOMD BOD
  INNER JOIN ITMMASTER ITM
  ON BOD.CPNITMREF_0 = ITM.ITMREF_0
  WHERE BOD.ITMREF_0 = '${itmref}'
`
export const getItemCategory = itmref => `
  SELECT ITMREF_0 as partNumber, TCLCOD_0 as itemCategory
  FROM ITMMASTER
  WHERE ITMREF_0 = '${itmref}'
`
