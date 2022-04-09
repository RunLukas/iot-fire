const path = require( 'path' );
const express = require( 'express' );

const session = require('express-session');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const socketIO = require( 'socket.io' );
const mysql = require('mysql');
const bodyParser = require("body-parser");

// create an express app
const app = express();

const server = require('http').createServer(app);

const sessionMiddleware = session({
  secret: "keyboard cat",
  cookie: { maxAge: 600000000 }
});


app.use(sessionMiddleware);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());


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
const { toggle } = require( './arduino-control' );
const {state} = require('./arduino-control.js');

/* ----------------------------- ARDUINO -----------------------------------*/

const { SerialPort, ReadlineParser } = require('serialport');
const port = new SerialPort({path: '/dev/ttyACM0', baudRate: 9600, });
const parser = new ReadlineParser()
port.pipe(parser)

// Read the port data
port.on("open", () => {
  console.log('serial port open');
});

parser.on('data', function (data) {
  console.log('Data:', data)
});

function odpri(){
  port.write('O', (err) => {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
  console.log('odpri - sent');
  });
}

function zapri(){
  port.write('Z', (err) => {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
  console.log('zapri - sent');
  });
}

function light(){
  port.write('L', (err) => {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
  console.log('luc - sent');
  });
}

/* --------------------------------------------------------------------------*/

// send asset files
app.use( '/assets/', express.static( path.resolve( __dirname, 'web-app' ) ) );
app.use( '/assets/', express.static( path.resolve( __dirname, 'node_modules/socket.io-client/dist' ) ) );


/* ------------------------------------- */

app.get("/", (req, res) => {
  const isAuthenticated = !!req.user;
  if (isAuthenticated) {
    console.log(`user is authenticated, session is ${req.session.id}`);
  } else {
    console.log("unknown user");
  }
  res.sendFile(isAuthenticated ? "web-app/index.html" : "web-app/login.html", { root: __dirname });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  })
);

app.get("/calendar", (req, res) => {
  const isAuthenticated = !!req.user;
  if (isAuthenticated) {
    console.log(`user is authenticated, session is ${req.session.id}`);
  } else {
    console.log("unknown user");
  }
  res.sendFile(isAuthenticated ? "web-app/calendar.html" : "web-app/login.html", { root: __dirname });
});

app.post("/logout", (req, res) => {
  console.log(`logout ${req.session.id}`);
  const socketId = req.session.socketId;
  if (socketId && io.of("/").sockets.get(socketId)) {
    console.log(`forcefully closing socket ${socketId}`);
    io.of("/").sockets.get(socketId).disconnect(true);
  }
  req.logout();
  res.cookie("connect.sid", "", { expires: new Date() });
  res.redirect("/");
});

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

const {cryptPassword} = require('./web-app/password.js');
const {comparePassword} = require('./web-app/password.js');

passport.use(new LocalStrategy(function verify(username, password, cb) {
  con.query("SELECT * FROM user WHERE username= ?;", [username], function(err, result, fields) {
    if (err) { return cb(err); }
    if (result == "") { return cb(null, false, { message: 'Incorrect username or password.' }); }

    comparePassword(password, result[0].geslo, (err, match) => {
      if (match != true) {return cb(null, false, { message: 'Incorrect username or password.' }); }
      return cb(null, result);
    });
    
  });
}));
/* ------------------------------------- */



// create a WebSocket server
const io = socketIO( server );

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

io.use((socket, next) => {
  if (socket.request.user) {
    next();
  } else {
    next(new Error('unauthorized'))
  }
});


io.on( 'connection', ( client ) => {
  console.log(`new connection ${client.id}`);
  client.on('login', (cb) => {
    cb(client.request.user ? client.request.user.username : '');
  });

  const session = client.request.session;
  console.log(`saving sid ${client.id} in session ${client.id}`);
  session.client = client.id;
  session.save();
  
  client.on('register', (username, name, lastName, email, password) => {
    let cipher = CryptoJS.AES.encrypt(password, key);
    cipher = cipher.toString();
    let decipher = CryptoJS.AES.decrypt(cipher, key);
    decipher = decipher.toString(CryptoJS.enc.Utf8);
    console.log(decipher);
    CryptoJS.AES.decrypt(cipher, key).toString;

    con.query("INSERT INTO user (username, ime, priimek, email, geslo) VALUES (?, ?, ?, ?, ?);", [username, name, lastName, email, cipher], function (err, result, fields) {
      if (err) throw err;
      console.log(result);
    });
  });

  client.emit("initialStateCheck", state());
  
  // listen to `arduino-toggle` event
  client.on( 'arduino-toggle', ( data ) => {
    console.log( 'Received arduino-toggle event from', client.handshake.address, new Date());
    if(data.d1 == 1 && data.d2 == 0){odpri();} // toggle LEDs
    else if (data.d2 == 1 && data.d1 == 0) {zapri();}
    else if(data.d3 == 1) {light();}
  } );
} );

server.listen(9000, () => {
  console.log(`application is running at: http://localhost:9000`);
});