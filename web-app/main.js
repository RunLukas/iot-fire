
// get button elements
let buttonDoor1 = document.getElementById( 'door1' );
let buttonLight = document.getElementById( 'light' );

let buttonDoor1state = false;
let buttonLightstate = false;
// check for active connection
var isConnectionActive = false;

// connect to the Web Socket server
var connection = io( 'http://192.168.71.65:9000' );

// when connection is established 
connection.on( 'connect', () => {
  isConnectionActive = true;
} );

connection.on( 'disconnect', () => {
  isConnectionActive = false;
} );

function buttonColors(data){
  if(data.d1 == true) {buttonDoor1.style.backgroundColor = "green"; buttonDoor1.innerText = "ZAPRI VRATA";}
  else if(data.d1 == false) {buttonDoor1.style.backgroundColor = "red"; buttonDoor1.innerText = "ODPRI VRATA";}

  if(data.l1 == true) {buttonLight.style.backgroundColor = "green"; buttonLight.innerText = "UGASNI LUČ";}
  else if(data.l1 == false) {buttonLight.style.backgroundColor = "red"; buttonLight.innerText = "PRIŽGI LUČ";}
}

connection.on("buttonStates", (data)=>{
  buttonDoor1state = data.d1;
  buttonLightstate = data.l1;
  buttonColors(data);
});

function a(){
  data = {
    d1: buttonDoor1state,
    l1: buttonLightstate,
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
  if( event.target.id === 'door1') { buttonDoor1state = !buttonDoor1state}
  if( event.target.id === 'light') { buttonLightstate = !buttonLightstate; }

  buttonColors(a());

  // emit `led-toggle` socket event
  connection.emit( 'arduino-toggle', a());
};

connection.on("barve", (data)=>{
  if(data.d1 == true) buttonDoor1.style.backgroundColor = "green";
  else if(data.d1 == false) buttonDoor1.style.backgroundColor = "red";

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
light.addEventListener( 'click', emitEvent );