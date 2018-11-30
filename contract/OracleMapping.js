"use strict";

function init(bar)
{
  storageStore('owner', sender);
  return;
}


function makeKey(name, time) {
   return 'S'+name+'T'+time;
}

function setPrice(_stockName, _timeslot, _price ) {
   //Ensuring prices are 24 hours
   assert(_timeslot >= 0 && _timeslot <= 23, 'prices need to be 24 hours');
   storageStore(makeKey(_stockName, _timeslot), JSON.stringify(_price));
}

//Getter to be used internatlly for the relevant Smart Contracts
function getPrice(_stockName, _timeslot) {
    return JSON.parse(storageLoad(makeKey(_stockName, _timeslot)));
}

/*** STANDARD ENTITY MODIFIER DEFINED BELOW. DO NOT MODIFY. ***/
function main(input)
{
  let para = JSON.parse(input);
  let args = para.params;
  if (para.method === "setPrice") {
    setPrice(args.stockname, args.timeslot, args.price);
  } 
}

/*** STANDARD ENTITY QUERY DEFINED BELOW. DO NOT MODIFY. ***/
function query(input)
{ 
  let para = JSON.parse(input);
  let args = para.params;
  if (para.method === "getPrice") {
    return JSON.stringify(getPrice(args.stockname, args.timeslot));
  } 
  else {
    return thisAddress;
  }
}
