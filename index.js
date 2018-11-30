// Necessary 3rd party libraries
const fetch = require('node-fetch');
const schedule = require('node-schedule');

const BigNumber = require('bignumber.js');
const BumoSDK = require('bumo-sdk');
const {keypair} = require('bumo-encryption');


// Configuration variables
require("dotenv").config();
const fetchSchedule = process.env.SCHEDULE || "5 * * * *";
const network = process.env.NETWORK || 'seed1.bumotest.io:26002'
const privateKey = process.env.SIGNER_PRIVATE_KEY;
if (!privateKey) {
  console.error(
    "A private key is required to sign contract function calls. Ensure adding your private key to .env file."
  );
  process.exit(1);
}

const sdk = new BumoSDK({
  host: network
});

// common helpers

// get the address from private key
// we only need to provide private key.
function getAddress(privateKeyey) {
   return keypair.getAddress(keypair.getEncPublicKey(privateKeyey));
}


// call the contract method with params by sending BU
function callContractMethod(args) {
  return new Promise(function(resolve, reject) {
    let address = args.address;
    let nonce;

    //build the operation
    sdk.operation.contractInvokeByBUOperation({
       contractAddress: args.contractAddr,
       sourceAddress:address,
       input:JSON.stringify({method:args.method, params:args.params}),
    }).then(op => {
       console.log(op);
       //send the transaction
       sendOperation({
	    from:address,
	    privateKey:args.privateKey,
	    op:op.result.operation,
       }).then(data => {
            resolve(data);
       });
    });
  });
}
// call the contract method with params by sending assets
// args.from: source address
// args.op: operation
// args.privateKey: private key
function sendOperation(args) {
    return new Promise(function(resolve, reject) {
       let nonce;
       //step 1 get source account address nonce
       sdk.account.getNonce(args.from).then(info => {
          if (info.errorCode !== 0) {
             console.log(info);
             return;
          }
          nonce = new BigNumber(info.result.nonce).plus(1).toString(10);
          console.log(nonce);

          // get feelimit
          sdk.transaction.evaluateFee({
             sourceAddress: args.from,
             nonce: nonce,
             operations: [args.op],
             signtureNumber: '1',
          }).then(fee => { 
             if (fee.errorCode !== 0) {
                console.log(fee);
                return;
             }
             console.log(fee);
             //step 2 operation (op) built by the caller
             //step 3 serialization
             let blobInfo = sdk.transaction.buildBlob({
                sourceAddress: args.from,
                gasPrice: fee.result.gasPrice,
                feeLimit: fee.result.feeLimit,
                nonce: nonce,
                operations: [ args.op ],
              });
              const blob = blobInfo.result.transactionBlob;
	   
              //step 4 sign the transaction
              const signatureInfo = sdk.transaction.sign({
                  privateKeys: [ args.privateKey ],
                  blob,
              });

              //step 5 submit the transaction
              const signature = signatureInfo.result.signatures;
              console.log(signatureInfo);
              sdk.transaction.submit({
                blob,
                signature: signature,
              }).then(data => {
		   resolve(data);
              });
         });
       });
    });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkTxStatus(hash, handleResult) {
  let result;
  while ((result = await sdk.transaction.getInfo(hash) ).errorCode != 0) {
    await sleep(1000);
  }
  handleResult(result.result);
}

// start of the original script
const contractDetails = require("./src/contract-details");
const normalizedPath = require("path").join(__dirname, "modules");
const modules = require("fs")
  .readdirSync(normalizedPath)
  .filter(file => file.match(/\.js$/) !== null)
  .map(file => require("./modules/" + file));

function processFeed(feed) {
  return fetch(feed.URL).then(res => {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes(feed.contentType)) {
        return res[feed.bodyParser]();
      }
      throw new 
        TypeError(`${feed.ID}: Expected content-type ${feed.contentType} but received ${contentType.join(', ')}.`);
    })
    .then(body => {
      return new Promise((resolve, reject) => {
        const data = feed.priceSelector(body);
        if (data) {
          resolve(data)
        }
        else {
          reject(`${feed.ID}: Unable to select price.`)
        }
      })
    });
}

function run(modules, contract) {
  if(modules.length) {
    const module = modules.shift()
    console.log(module)
    processFeed(module).then((price, err) => {
      console.log(module.oracleID, price)
      if (err)
        console.error(err)

      const feedID = module.oracleID;
      const timeslot = new Date().getUTCHours();
      callContractMethod({
         address: contractDetails.address,
         privateKey:privateKey,
         contractAddr:contractDetails.address,
         method: 'setPrice',
         params: {
            stockname:feedID,
            timeslot: timeslot,
            price: price
         },
      }) .then(count => {
          console.log(`getTransactionCount: ${count}`)
          return contract.setPrice(feedID, timeslot, price, options)
        }).then(
          result => {
            console.log("Result:  " + JSON.stringify(result))
            run(modules, contract)
          },
          err => console.error("Error msg: " + err)
        )
        // TODO
        .then(info => {
                console.log(info);
                if (info.errorCode == 0) {
                   checkTxStatus(info.result.hash, (result) => {
                     console.log("success");
                   });
                } else {
                   consoele.log(
                     reason:JSON.parse(result.transaction[0].errorDesc)[0]
                   );
                }
        }) 
        .catch(error => console.error)
    })
  }
}

run(modules, contract);
const j = schedule.scheduleJob(fetchSchedule, function() {
  run(modules, contract);
});



