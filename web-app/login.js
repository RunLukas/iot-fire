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

const fetchValue = id => document.getElementById( id ).value;

function login(){
  const username = fetchValue( "username" );
  const password = fetchValue( "password" );

  if(username == ""){alert("Prazno polje za ime"); return;}
  if(password == ""){alert("Prazno polje za geslo"); return;}

  connection.emit('login', username, password);
}

connection.on("wrongLogin", (error) => {
  alert(error);
});

connection.on("onLogin", () => {
  window.location.href = "index";
});

function register(){
  const username = fetchValue( "username" );
  const name = fetchValue( "name" );
  const lastName = fetchValue( "lastName" );
  const email = fetchValue( "email" );
  const password = fetchValue( "password" );

  if(username == ""){alert("Prazno polje za uporabniško ime"); return;}
  if(name == ""){alert("Prazno polje za ime"); return;}
  if(lastName == ""){alert("Prazno polje za priimek"); return;}
  if(email == ""){alert("Prazno polje za email"); return;}
  if(password == ""){alert("Prazno polje za geslo"); return;}

  connection.emit('register', username, name, lastName, email, password);
}