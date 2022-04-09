
// get button elements
let buttonDoor1 = document.getElementById( 'door1' );
let buttonDoor2 = document.getElementById( 'door2' );
let buttonLight = document.getElementById( 'light' );

let buttonDoor1state = false;
let buttonDoor2state = false;
let buttonLightstate = false;
// check for active connection
var isConnectionActive = false;

// connect to the Web Socket server
var connection = io( 'http://192.168.0.27:9000' );

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

  if(data.d3 == true) buttonLight.style.backgroundColor = "green";
  else if(data.d3 == false) buttonLight.style.backgroundColor = "red";
}

connection.on("initialStateCheck", (data)=>{
  buttonDoor1state = data.d1;
  buttonDoor2state = data.d2;
  buttonLightstate = data.d3;
  buttonColors(data);
});

function a(){
  data = {
    d1: buttonDoor1state,
    d2: buttonDoor2state,
    d3: buttonLightstate,
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
  if( event.target.id === 'door1') { buttonDoor1state = 1; buttonDoor2state = 1;}
  if( event.target.id === 'door2') { buttonDoor1state = 0; buttonDoor2state = 0; }
  if( event.target.id === 'light') { buttonLightstate = !buttonLightState; }

  buttonColors(a());

  // emit `led-toggle` socket event
  connection.emit( 'arduino-toggle', a());
  
  if( event.target.id === 'door1') { buttonDoor1state = 0; }
  if( event.target.id === 'door2') { buttonDoor2state = 0; }
  //if( event.target.id === 'light') { buttonLightstate = !buttonLightState; }
};

connection.on("barve", (data)=>{
  if(data.d1 == true) buttonDoor1.style.backgroundColor = "green";
  else if(data.d1 == false) buttonDoor1.style.backgroundColor = "red";

  if(data.d2 == true) buttonDoor2.style.backgroundColor = "green";
  else if(data.d2 == false) buttonDoor2.style.backgroundColor = "red";

  if(data.d3 == true) light.style.backgroundColor = "green";
  else if(data.d3 == false) light.style.backgroundColor = "red";
});


let logout = document.getElementById("logoutButton");
let logoutForm = document.getElementById("logout");
logout.addEventListener("click",() => logoutForm.submit());
/*
let calendar = document.getElementById("calendarButton");
let calendarForm = document.getElementById("calendar");
calendar.addEventListener("click",() => calendarForm.submit());*/

// add event listeners on button
buttonDoor1.addEventListener( 'click', emitEvent );
buttonDoor2.addEventListener( 'click', emitEvent );
light.addEventListener( 'click', emitEvent );