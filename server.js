const path = require( 'path' );
const express = require( 'express' );

const cookieParser = require("cookie-parser");
const session = require('express-session');

const socketIO = require( 'socket.io' );
const mysql = require('mysql');
const CryptoJS = require("crypto-js");

const con = mysql.createConnection({
  host: "localhost",
  user: "webuser",
  password: "gasilci1909",
  database: "iotFire"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Database connected!");
});

// import LED control API
const { toggle } = require( './led-control' );
const {state} = require('./led-control.js');

// create an express app
const app = express();

// send `index.html` from the current directory
// when `http://<ip>:9000/` route is accessed using `GET` method
app.get( '/login', ( request, response ) => {
  response.sendFile( path.resolve( __dirname, 'web-app/login.html' ), {
    headers: {
      'Content-Type': 'text/html',
    }
  } );
} );

app.get( '/index', ( request, response ) => {
  response.sendFile( path.resolve( __dirname, 'web-app/index.html' ), {
    headers: {
      'Content-Type': 'text/html',
    }
  } );
} );

// send asset files
app.use( '/assets/', express.static( path.resolve( __dirname, 'web-app' ) ) );
app.use( '/assets/', express.static( path.resolve( __dirname, 'node_modules/socket.io-client/dist' ) ) );

// server listens on `9000` port
const server = app.listen( 9000, () => console.log( 'Express server started!' ) );

// create a WebSocket server
const io = socketIO( server );

let key = "ASECRET";

// listen for connection
io.on( 'connection', ( client ) => {
  console.log( 'SOCKET: ', 'A client connected', client.handshake.address, client.handshake.time);
  
  client.on('register', (username, name, lastName, email, password) => {
    let cipher = CryptoJS.AES.encrypt(password, key);
    cipher = cipher.toString();
    /*
    let decipher = CryptoJS.AES.decrypt(cipher, key);
    decipher = decipher.toString(CryptoJS.enc.Utf8);
    console.log(decipher);
    CryptoJS.AES.decrypt(cipher, key).toString;
    */

    con.query("INSERT INTO user (username, ime, priimek, email, geslo) VALUES (?, ?, ?, ?, ?);", [username, name, lastName, email, cipher], function (err, result, fields) {
      if (err) throw err;
      console.log(result);
    });
  });
  
  //Login
  client.on('login', (username, password) => {
    let cipher = CryptoJS.AES.encrypt(password, key);
    cipher = cipher.toString();

    con.query("SELECT * FROM user WHERE username= ?;", [username], function (err, result, fields) {
      if (err) throw err;
      if  (result == "") {client.emit("wrongLogin", "Napačno uporabniško ime."); return;}
      let decipher = CryptoJS.AES.decrypt(result[0].geslo, key);
      decipher = decipher.toString(CryptoJS.enc.Utf8);
      if(decipher == password) {
        client.emit("onLogin", false);
      }
      else client.emit("wrongLogin", "Napačno geslo.");
    });
  });

  client.emit("initialStateCheck", state());
  
  // listen to `led-toggle` event
  client.on( 'led-toggle', ( data ) => {
    console.log( 'Received led-toggle event from', client.handshake.address, new Date());
    toggle( data.d1, data.d2, data.d3, data.d4, data.d5, data.da ); // toggle LEDs
    io.emit("barve", state());
    console.log(state());
  } );
} );