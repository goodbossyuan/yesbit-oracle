# basic-oracle

Oracle contract that contains assets hourly prices + Nodejs service 

### Install

- `git clone git@github.com:yesbit/basic-oracle.git`
- `cd basic-oracle`
- `npm install`
- `touch .env`
- A private key is required to sign contract function calls. So add one to `.env` file as follows:
```
SIGNER_PRIVATE_KEY=0x1235432.....
```
- NodeJS service is scheduled, internally, using crontab-like configuration. In order to run the NodeJS service on the first minute of each hour, you need to add the following line to `.env` file:
```
SCHEDULE="* * * * *"
```

### Run NodeJS daemon

The NodeJS service needs to be running 24/7 in order to feed Oracle contract with data. You can run it as follows:

```
npm run start:node
```

If everything is OK, server will show some logs as follows:
```
> basic-oracle@0.0.1 start:node [path-to-repo]/projects/basic-oracle
> nodemon index.js

[nodemon] 1.18.4
[nodemon] to restart at any time, enter `rs`
[nodemon] watching: *.*
[nodemon] starting `node index.js`
{ ID: 'USDCAD',
  oracleID: 0,
  URL:
   'https://free.currencyconverterapi.com/api/v6/convert?q=USD_CAD&compact=y',
  contentType: 'application/json',
  bodyParser: 'json',
  priceSelector: [Function: priceSelector] }
0 1324320
getTransactionCount: 3778
Result:  {"nonce":3778,"gasPrice":{"_bn":"b2d05e00"},"gasLimit":{"_bn":"16e360"},"to":"0x323919c6dF517765070f4b75Bb886B5Edb927bF4","value":{"_bn":"0"},"data":"0xaa585d56000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000143520","v":42,"r":"0x352200273ef5d8ccf5aadf7c08958f4ac136564f7d24ee53a4f6fb3a5d84a9c6","s":"0x68bdecc5d5f5508682d4067f48db78fd1cef9bb456e9359a31ee73c3ef5956db","chainId":3,"from":"0x496bA215Bf36a7EfE090bfB40881cDE16cA5E4F0","hash":"0xe2596c37ad375ef565b9fc0dae6a80766b874da47b3332c1df5e53c998b30ded"}
{ ID: 'BTCUSD',
  oracleID: 1,
  URL:
   'https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD',
  contentType: 'application/json',
  bodyParser: 'json',
  priceSelector: [Function: priceSelector] }
1 5665230000
```

### Run React UI

The React UI reads information from Oracle contract, and displays it in a chart. Simply run the following command to start it:

```
npm start
```

A web server will start `http://localhost:3000`, then a browser tab will open at that URL, automatically.