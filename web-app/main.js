
// get button elements
let buttonDoor1 = document.getElementById( 'door1' );
let buttonDoor2 = document.getElementById( 'door2' );
let buttonDoor3 = document.getElementById( 'door3' );
let buttonDoor4 = document.getElementById( 'door4' );
let buttonDoor5 = document.getElementById( 'door5' );
let buttonDoorAll = document.getElementById( 'doorAll' );

let buttonDoor1state = false;
let buttonDoor2state = false;
let buttonDoor3state = false;
let buttonDoor4state = false;
let buttonDoor5state = false;
let buttonDoorAllState = false;

// check for active connection
var isConnectionActive = false;

// connect to the Web Socket server
var connection = io( 'http://192.168.1.10:9000' );

// when connection is established 
connection.on( 'connect', () => {
  isConnectionActive = true;
} );

connection.on( 'disconnect', () => {
  isConnectionActive = false;
} );

function buttonColors(data){
  if(data.d1 == true) buttonDoor1.style.backgroundColor = "green";
  else if(data.d1 == false) buttonDoor1.style.backgroundColor = "red";

  if(data.d2 == true) buttonDoor2.style.backgroundColor = "green";
  else if(data.d2 == false) buttonDoor2.style.backgroundColor = "red";

  if(data.d3 == true) buttonDoor3.style.backgroundColor = "green";
  else if(data.d3 == false) buttonDoor3.style.backgroundColor = "red";

  if(data.d4 == true) buttonDoor4.style.backgroundColor = "green";
  else if(data.d4 == false) buttonDoor4.style.backgroundColor = "red";

  if(data.d5 == true) buttonDoor5.style.backgroundColor = "green";
  else if(data.d5 == false) buttonDoor5.style.backgroundColor = "red";

  if(data.da == true) buttonDoorAll.style.backgroundColor = "green";
  else if(data.da == false) buttonDoorAll.style.backgroundColor = "red";
}

connection.on("initialStateCheck", (data)=>{
  buttonDoor1state = data.d1;
  buttonDoor2state = data.d2;
  buttonDoor3state = data.d3;
  buttonDoor4state = data.d4;
  buttonDoor5state = data.d5;
  buttonDoorAllState = data.da;
  buttonColors(data);
});

function a(){
  data = {
    d1: buttonDoor1state,
    d2: buttonDoor2state,
    d3: buttonDoor3state,
    d4: buttonDoor4state,
    d5: buttonDoor5state,
    da: buttonDoorAllState
  }
  console.log(data);
  return data;
}


// WebSocket event emitter function
var emitEvent = function( event ) {
  if( ! isConnectionActive ) {
    return alert( 'Server connection is closed!' );
  }

  // change button state
  if( event.target.id === 'door1') { buttonDoor1state = ! buttonDoor1state; }
  if( event.target.id === 'door2') { buttonDoor2state = ! buttonDoor2state; }
  if( event.target.id === 'door3') { buttonDoor3state = ! buttonDoor3state; }
  if( event.target.id === 'door4') { buttonDoor4state = ! buttonDoor4state; }
  if( event.target.id === 'door5') { buttonDoor5state = ! buttonDoor5state; }
  if( event.target.id === 'doorAll') { 
    buttonDoor1state = ! buttonDoor1state;
    buttonDoor2state = ! buttonDoor2state;
    buttonDoor3state = ! buttonDoor3state;
    buttonDoor4state = ! buttonDoor4state;
    buttonDoor5state = ! buttonDoor5state;
   }

  // emit `led-toggle` socket event
  connection.emit( 'led-toggle', a());
};

connection.on("barve", (data)=>{
  if(data.d1 == true) buttonDoor1.style.backgroundColor = "green";
  else if(data.d1 == false) buttonDoor1.style.backgroundColor = "red";

  if(data.d2 == true) buttonDoor2.style.backgroundColor = "green";
  else if(data.d2 == false) buttonDoor2.style.backgroundColor = "red";

  if(data.d3 == true) buttonDoor3.style.backgroundColor = "green";
  else if(data.d3 == false) buttonDoor3.style.backgroundColor = "red";

  if(data.d4 == true) buttonDoor4.style.backgroundColor = "green";
  else if(data.d4 == false) buttonDoor4.style.backgroundColor = "red";

  if(data.d5 == true) buttonDoor5.style.backgroundColor = "green";
  else if(data.d5 == false) buttonDoor5.style.backgroundColor = "red";

  if(data.da == true) buttonDoorAll.style.backgroundColor = "green";
  else if(data.da == false) buttonDoorAll.style.backgroundColor = "red";
});

// add event listeners on button
buttonDoor1.addEventListener( 'click', emitEvent );
buttonDoor2.addEventListener( 'click', emitEvent );
buttonDoor3.addEventListener( 'click', emitEvent );
buttonDoor4.addEventListener( 'click', emitEvent );
buttonDoor5.addEventListener( 'click', emitEvent );
buttonDoorAll.addEventListener( 'click', emitEvent );