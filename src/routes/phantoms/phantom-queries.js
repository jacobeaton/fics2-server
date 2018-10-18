export const getBomd = (itmref, qty) => `
  SELECT CPNITMREF_0 as partNumber, BOMQTY_0 * ${qty} as qty 
  FROM BOMD
  WHERE ITMREF_0 = '${itmref}'
`
