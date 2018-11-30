import React, { Component } from 'react';
import Loader from "react-loader-spinner";
import { VictoryChart, VictoryLine, VictoryScatter, VictoryAxis, VictoryLabel } from 'victory';

import contractDetails from './contract-details';
import './App.css';

// TODO hardcoded for now. Import from Oracle-Nodejs repo
const modules = {
  0: {
    ID: "USDCAD",
    oracleID: 0,
    multiplier: 1000000,
  },
  1: {
    ID: "BTCUSD",
    oracleID: 1,
    multiplier: 1000000,
  }
};

function _modules2SelectOpts({ID, oracleID}) {
  return {value: oracleID, label: ID}
}

const Spinner = props => (
  <Loader type="Oval" color="#00BFFF" height="100" width="100" />
);

const BigNumber = require('bignumber.js');
const BumoSDK = require('bumo-sdk');
var fs = require('fs');
const sdk = new BumoSDK({
  host: 'seed1.bumotest.io:26002',
});


const MarketSelect = ({ selected, selectHandler, options }) => (
  <label>
    Pick market:
    <select value={selected} onChange={selectHandler}>
    {options.map(({label, value}) => {
      return <option key={value} value={value}>{label}</option>;
    })}
    </select>
  </label>
);

const Chart = ({ entries, module }) => (
  <VictoryChart height={200} polar={false}>
    <VictoryAxis standalone={false} tickCount={24} label={"Time slot"} />
    <VictoryAxis
      dependentAxis
      fixLabelOverlap
      label={modules[module].ID}
      axisLabelComponent={<VictoryLabel dy={-70} dx={10} angle={0} />}
    />
    <VictoryLine
      interpolation={"linear"}
      data={entries}
      style={{ data: { stroke: "#5897f5" } }}
    />
    <VictoryScatter
      data={entries}
      size={2}
      style={{ data: { fill: "#5897f5" } }}
    />
  </VictoryChart>
);

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      entries: [],
      module: 1,
    };
    this.contract = null;

    this.setTimeslotPrice = this.setTimeslotPrice.bind(this)
    this.handleMarketChange = this.handleMarketChange.bind(this)
    this.fetchPrices = this.fetchPrices.bind(this)
  }

  _indexes() {
    return Array(24)
      .fill()
      .map((val, i) => i);
  }

  setTimeslotPrice(timeslot, price) {
    this.setState({entries: [...this.state.entries, {x:timeslot, y:price}] })
  }

  fetchPrices(contract, module) {
    this.setState({ loading: true, entries: [] })
    const promises = this._indexes().map(i => {
      return sdk.contract.call({
        contractAddress: contractAddress,
        input: JSON.stringify({
          method: 'getPrice',
          params: {
            stockname:module,
            timeslot:i
          }
        }),
        optType: 2,  //query
      }).then(data => {
        this.setTimeslotPrice(i, 
           JSON.parse(data:data.result.query_rets[0].result.value));
      }).catch(err => console.error("Error msg: " + JSON.stringify(err)));
    });
    Promise.all(promises).then(() => {
      this.setState({ loading: false });
    });
  }

  handleMarketChange(event) {
    const module = event.target.value;
    this.setState({module: module})
    this.fetchPrices(this.contract, module);
  }

  componentDidMount(prevProps) {
    const module = this.state.module;

    this.fetchPrices(this.contract, module);
  }

  render() {
    let { module, loading, entries } = this.state;
    const timeslot = new Date().getUTCHours()
    
    entries = entries
      // Order by timeslot, ascendingly
      .sort((a, b) => a.x >= b.x ? 1 : -1)
      // Make sure current timeslot is displayed last

    entries.unshift(...entries.splice(entries.findIndex((item) => item.x === timeslot) + 1))
    console.log(entries)

      // Cast 'x' to string to prevent Victory from sorting list according to it.
      // @see https://github.com/FormidableLabs/victory/issues/661#issuecomment-316786936
    entries = entries.map(( {x ,y}) => { return {y, x: `${x}`} })
  
    loading === false && console.log(entries)

    return <div className="App">
        <header className="App-header">
          <h1 className="App-title">Yesbit Oracle</h1>
          <h3>
            <a
              href={`https://ropsten.etherscan.io/address/${
                contractDetails.address
              }`}
            >
              {`View deployed contract on etherscan.io/address/${
                contractDetails.address
              }`}
            </a>
          </h3>
        </header>
        <div className="App-intro" style={{display: 'flex', flexDirection: 'column'}}>
          <span>Current time slot: {timeslot}</span>
          <MarketSelect selected={module} selectHandler={this.handleMarketChange} options={Object.values(modules).map(_modules2SelectOpts)} />
          {(loading && <Spinner />) || <Chart entries={entries} module={module} />}
        </div>
      </div>;
  }
}

export default App;
