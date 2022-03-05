const path = require( 'path' );
const express = require( 'express' );

const cookieParser = require("cookie-parser");
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

/*
passport.use(
  new LocalStrategy((username, password, done) => {
    if (username === "john" && password === "doe") {
      console.log("authentication OK");
      return done(null, DUMMY_USER);
    } else {
      console.log("wrong credentials");
      return done(null, false);
    }
  })
);*/



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

// send asset files
app.use( '/assets/', express.static( path.resolve( __dirname, 'web-app' ) ) );
app.use( '/assets/', express.static( path.resolve( __dirname, 'node_modules/socket.io-client/dist' ) ) );

// server listens on `9000` port
/*
const server = require('http').createServer(app);
server.listen(9000, () => {
  console.log("Server started")
});
*/

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
    /*
    crypto.pbkdf2(password, result.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
      if (err) { return cb(err); }
      if (!crypto.timingSafeEqual(result[0].geslo, hashedPassword)) {
        return cb(null, false, { message: 'Incorrect username or password.' });
      }
      return cb(null, result);*/
    
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

/*
io.use(function (socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});
app.use(sessionMiddleware);
app.use(cookieParser());

app.get("/*", function(req, res, next) {

  if(typeof req.cookies['connect.sid'] !== 'undefined') {
      console.log(req.cookies['connect.sid']);
  }

  next(); // Call the next middleware
});*/

// listen for connection


io.on( 'connection', ( client ) => {
  /*console.log( 'SOCKET: ', 'A client connected', client.handshake.address, client.handshake.time);
  */
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

  /*
  let req = client.request;

  console.log(req.session.userID);
  if(req.session.userID != null){
    con.query("SELECT * FROM user WHERE id=?", [req.session.userID], function(err, rows, fields){
      socket.emit("onLogin", false); //Lahko dodam ime
    });
  }
  
  
  client.on('register', (username, name, lastName, email, password) => {
    let cipher = CryptoJS.AES.encrypt(password, key);
    cipher = cipher.toString();
    /*
    let decipher = CryptoJS.AES.decrypt(cipher, key);
    decipher = decipher.toString(CryptoJS.enc.Utf8);
    console.log(decipher);
    CryptoJS.AES.decrypt(cipher, key).toString;
    */
/*
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
        req.session.userID = result[0].id;
        req.session.save();
        console.log(req.session.userID);
        /*
        req.header("Access-Control-Allow-Credentials", 'true');
        client.emit("onLogin", false);
      }
      else client.emit("wrongLogin", "Napačno geslo.");
    });
  });*/

  client.emit("initialStateCheck", state());
  
  // listen to `led-toggle` event
  client.on( 'led-toggle', ( data ) => {
    console.log( 'Received led-toggle event from', client.handshake.address, new Date());
    toggle( data.d1, data.d2, data.d3, data.d4, data.d5, data.da ); // toggle LEDs
    io.emit("barve", state());
    console.log(state());
  } );
} );

server.listen(9000, () => {
  console.log(`application is running at: http://localhost:9000`);
});