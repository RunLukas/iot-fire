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
/*
const {state} = require('./arduino-control.js');*/

/* ----------------------------- ARDUINO -----------------------------------*/

let stanjeVrat = 0;
let stanjeLuci = 0;

const { SerialPort, ReadlineParser } = require('serialport');
const port = new SerialPort({path: '/dev/ttyACM0', baudRate: 9600, });
const parser = new ReadlineParser()
port.pipe(parser)

// Read the port data
port.on("open", () => {
  console.log('serial port open');
});

parser.on('data', function (data) {
  if(data == 0) stanjeVrat = 0;
  else if (data == 1) stanjeVrat = 1;
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

function state(){
  data = {
    d1: stanjeVrat,
    l1: stanjeLuci,
  }
  return data;
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
    console.log(`ip: ${req.ip}`)
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

app.get("/assets/*", (req, res) => {
  res.sendFile( req.path, { root: __dirname });
});

/*
app.get("/register", (req, res) => {
  res.sendFile( "web-app/register.html", { root: __dirname });
});
*/

app.get("/calendar", (req, res) => {
  const isAuthenticated = !!req.user;
  if (isAuthenticated) {
    console.log(`user is authenticated, session is ${req.session.id}`);
  } else {
    console.log("unknown user");
  }
  res.sendFile(isAuthenticated ? "web-app/calendar.html" : "web-app/login.html", { root: __dirname });
});

app.get("/izvozi", (req, res) => {
  const isAuthenticated = !!req.user;
  if (isAuthenticated) {
    console.log(`user is authenticated, session is ${req.session.id}`);
  } else {
    console.log("unknown user");
  }
  res.sendFile(isAuthenticated ? "web-app/izvozi.html" : "web-app/login.html", { root: __dirname });
});

app.get("/profil", (req, res) => {
  const isAuthenticated = !!req.user;
  if (isAuthenticated) {
    console.log(`user is authenticated, session is ${req.session.id}`);
  } else {
    console.log("unknown user");
  }
  res.sendFile(isAuthenticated ? "web-app/profil.html" : "web-app/login.html", { root: __dirname });
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

async function getIzvozi(){
  let datai
  const query = new Promise((resolve, reject) => { con.query('SELECT i.id, v.naziv, i.namen, i.datum, i.izvoz, i.prihod, CONCAT(u.ime, " ", u.priimek) AS imeinpriimek FROM izvoz i INNER JOIN vozilo v ON (i.voziloID = v.id) INNER JOIN user u ON (i.voznikID = u.id) ORDER BY i.id DESC', function(err, data) {
    if (err) {
        console.log("err");

    } else {
        datai = data;
        resolve();
    }
  });
});
  await query;
  return JSON.stringify(datai);
}

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
    con.query("SELECT * FROM user WHERE username= ?;", [username], function (err, result, fields) {
      if (err) throw err;
      if  (result != "") {client.emit("wrongLogin", "To uporabniško ime je že v uporabi!"); return null;}
    

    cryptPassword(password, (err, hash) => {
      con.query("INSERT INTO user (username, ime, priimek, email, geslo) VALUES (?, ?, ?, ?, ?);", [username, name, lastName, email, hash], function (err, result, fields) {
        if (err) throw err;
        console.log(result);
      });
    });
    });
  });

  client.on('table', async () =>{
    let result = await getIzvozi();
    client.emit('returnTable', result);
  });

  client.on('getUserData', async () =>{
    let data = session.passport.user;
    client.emit('userData', data);
  });

  client.emit("buttonStates", state());
  
  // listen to `arduino-toggle` event
  client.on( 'arduino-toggle', ( data ) => {
    console.log( 'Received arduino-toggle event from', client.handshake.address, new Date());
    if(data.d1 == 1 && data.d1 != stanjeVrat){odpri();} // toggle LEDs
    else if(data.d1 == 0 && data.d1 != stanjeVrat){zapri();} 
    else if(data.l1 != stanjeLuci) {light();}
    stanjeVrat = data.d1;
    stanjeLuci = data.l1;
    io.emit("buttonStates", state());
  } );
} );

server.listen(9000, () => {
  console.log(`application is running at: http://localhost:9000`);
});