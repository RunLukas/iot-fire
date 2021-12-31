// import `onoff` package
const { Gpio } = require( 'onoff' );

// configure LED pins
const pin_door1 = new Gpio( 26, 'out' );
const pin_door2 = new Gpio( 19, 'out' );
const pin_door3 = new Gpio( 13, 'out' );
const pin_door4 = new Gpio( 21, 'out' );
const pin_door5 = new Gpio( 23, 'out' );
const pin_doorAll = new Gpio( 11, 'out' );

// toggle LED states
exports.toggle = ( d1, d2, d3, d4, d5, da ) => {
  pin_door1.writeSync( d1 ? 1 : 0 );
  pin_door2.writeSync( d2 ? 1 : 0 );
  pin_door3.writeSync( d3 ? 1 :0 );
  pin_door4.writeSync( d4 ? 1 :0 );
  pin_door5.writeSync( d5 ? 1 :0 );
  pin_doorAll.writeSync( da ? 1 :0 );
};

exports.state = () => {
  data = {
  d1: pin_door1.readSync(),
  d2: pin_door2.readSync(),
  d3: pin_door3.readSync(),
  d4: pin_door4.readSync(),
  d5: pin_door5.readSync(),
  da: pin_doorAll.readSync(),
  }
  return data;
}