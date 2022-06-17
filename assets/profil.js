// connect to the Web Socket server
let connection = io( 'http://192.168.71.65:9000' );

// when connection is established 
connection.on( 'connect', () => {
  isConnectionActive = true;
} );

connection.on( 'disconnect', () => {
  isConnectionActive = false;
} );

window.addEventListener('load', (event) => {
  connection.emit('getUserData', true);
});

connection.on('userData', (data)=>{
    let parsedData = data[0];
    document.getElementById("username").innerHTML = parsedData.username;
    document.getElementById("ime").innerHTML = parsedData.ime;
    document.getElementById("priimek").innerHTML = parsedData.priimek;
    document.getElementById("email").innerHTML = parsedData.email;
    if(parsedData.cin == "gasilec") document.getElementById("cin").innerHTML = "<img src=\"../assets/pictures/gasilec.jpg\" height=\"100px\">"
});