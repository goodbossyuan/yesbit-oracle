module.exports = {
  ID: 'USDCAD',
  oracleID: 0,
  URL: 'https://free.currencyconverterapi.com/api/v6/convert?q=USD_CAD&compact=y',
  contentType: 'application/json',
  bodyParser: 'json',
  priceSelector: body => Math.trunc(body['USD_CAD']['val'] * 1000000)
}