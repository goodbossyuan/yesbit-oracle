module.exports = {
  ID: "BTCUSD",
  oracleID: 1,
  URL:
    "https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD",
  contentType: "application/json",
  bodyParser: "json",
  priceSelector: body => Math.trunc(body["USD"] * 1000000)
}