const BigNumber = require('bignumber.js');
const BumoSDK = require('bumo-sdk');
const {keypair} = require('bumo-encryption');
const privK = process.env.PRIVK;
var fs = require('fs');

const sdk = new BumoSDK({
  host: 'seed1.bumotest.io:26002',
});

// get the address from private key
// we only need to provide private key.
function getAddress(privKey) {
   return keypair.getAddress(keypair.getEncPublicKey(privKey));
}

// call the contract method with params by sending assets
// using session variables. 
function sendOperation(session, op) {

    let address = session.address;
    let nonce;
    console.log(session);
    return new Promise(function(resolve, reject) {
       //step 1 get source account address
       sdk.account.getNonce(address).then(info => {
          if (info.errorCode !== 0) {
             console.log(info);
             return;
          }
          nonce = new BigNumber(info.result.nonce).plus(1).toString(10);
          console.log(nonce);
       
          //step 2 operation (op) built by the caller
          //step 3 serialization
          let blobInfo = sdk.transaction.buildBlob({
             sourceAddress: address,
             gasPrice: '1000',
             feeLimit: '1050000000', // 10.5BU
             nonce: nonce,
             operations: [ op ],
           });
           const blob = blobInfo.result.transactionBlob;
           //step 4 sign the transaction
           const signatureInfo = sdk.transaction.sign({
               privateKeys: [ session.privK ],
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
}

// call the contract method with params by sending BU
// using session variables. 
function createContract( session ) {

    let address = session.address;
    let payload;
    try {  
       payload = fs.readFileSync(session.file);
       console.log(payload);
    } catch(e) {
       console.log('Error:', e.stack);
    }
    //build the operation
    const op = sdk.operation.contractCreateOperation({
       initBalance: '1000000',
       payload:payload.toString(),
       sourceAddress:address,
     });

     console.log(op);

    //send the transaction
    return sendOperation(session, op.result.operation);
}


// main entrance
let session={};
session.privK = privK;
session.address = getAddress(privK);
session.file = process.env.FILE;

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

createContract(session).then(data => {
      console.log(data)
      if (data.errorCode == 0) {
         checkTxStatus(data.result.hash, (result) => {
           let desc = JSON.parse(result.transactions[0].error_desc);
           console.log(desc[0].contract_address);
         });            
      }
});
