pragma solidity ^0.4.23;


contract OracleMapping {

    address ownership;
    
    constructor() public {
        
        ownership = msg.sender;
    }

    /*
        - Mapping of an Asset To their Hourly Prices 
        - Maps an assest to hour to price 
        - 0 = Forex Price, 1 = Cryptocurrency (BTC) Price
    */ 
    mapping(uint256 => mapping(uint256 => uint256)) public AssetToHourToPrice;
    

    /* 

    - Setter for Price of an Asset 
    - Each Financial Contract is represented in uint256 with the term StockName. Ex: 0 = USD/CND, 1 = USD/EUR, 2= USD/JPN
    */

    function setPrice(uint256 _stockName, uint256 _timeslot, uint256 _price ) public returns (bool res){

        //Ensuring prices are 24 hours
        require(_timeslot >= 0 && _timeslot <= 23);
        AssetToHourToPrice[_stockName][_timeslot] = _price;
        return true;
    }

    //Getter to be used internatlly for the relevant Smart Contracts
    function getPrice(uint256 _stockName, uint256 _timeslot) public constant returns (uint256 res){

        uint256 value = AssetToHourToPrice[_stockName][_timeslot];

        return value;

    }
    
}
