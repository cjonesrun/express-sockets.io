var express = require("express"),
  app = express(),
  http = require("http"),
  server = http.createServer(app),
  path = require("path");

const io = require("socket.io")(server);

// Set up 'public' folder
app.use(express.static(path.join(__dirname, "/public")));

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/admin", (request, response) => {
  response.sendFile(__dirname + "/views/admin.html");
});

// Start server
const listener = server.listen(process.env.PORT, () => {
  console.log("Server started on port " + listener.address().port);
});

const processData = (sockets, data) => {
 for (var k of io.sockets.sockets.keys()) {
    let socket = io.sockets.sockets.get(k);
    if (accept(socket, data)) {
      console.log("emiting data to", socket.id)
      socket.emit('data', JSON.stringify(data));
    }
  }
}

// blast event data at the connected sockets on the specified interval
app.get("/blast/:millisinterval", (req, res) => {
  console.log("blasting data...", event_data.length, "events");
  
  event_data.forEach( (delta, index) => {
    setTimeout( () => {
      processData(io.sockets.sockets, delta);
    }, index * req.params.millisinterval);
    
  });
  io.sockets.emit("blast", "blasting " + event_data.length + " events at " + req.params.millisinterval +"ms interval.");
  res
    .status(200)
    .json({
      result: "OK",
      message: "blasted done",
      count: event_data.length
    });
});


// return a snapshot of sockets w/ attached filters
app.get("/status", (req, res) => {
  let filtermap = {};
  let keys = [];
  for (var k of io.sockets.sockets.keys()) {
    filtermap[k] = io.sockets.sockets.get(k).app_data_filter;
    keys.push[k];
    console.log("filter:", k, io.sockets.sockets.get(k).app_data_filter, JSON.stringify(filtermap));
  }
  
  console.log(`broadcast [${req.params.msg}] to ${JSON.stringify(keys)}`);

  res
    .status(200)
    .json({
      result: "OK",
      message: "message sent",
      sockets: filtermap,
      users: users
    });
});

  
// broadcast msg, emit it to all sockets
app.get("/broadcast/:msg", (req, res) => {
  //console.log( io.sockets );
  //console.log("socket ids:", io.sockets.sockets.keys());

  let filtermap = {};
  let keys = [];
  for (var k of io.sockets.sockets.keys()) {
    filtermap[k] = io.sockets.sockets.get(k).app_data_filter;
    keys.push[k];
    console.log("filter:", k, io.sockets.sockets.get(k).app_data_filter, JSON.stringify(filtermap));
  }
  
  console.log(`broadcast [${req.params.msg}] to ${JSON.stringify(keys)}`);

  /* const ids = io.allSockets()
    .then( (x) => { 
      
      x.forEach( (sid) => {
        console.log("filtering for socket:", sid)
        console.log(io.sockets.get(sid).rooms);
      })
    })
    .catch((y) => { 
      console.log("rejected", y);
    });*/

  //console.log("all sockets: ", io.sockets.allSockets());
  io.sockets.emit("broadcast", req.params.msg);
  res
    .status(200)
    .json({
      result: "OK",
      message: "message sent",
      sockets: filtermap,
      users: users
    });
});

// send msg to all sockets in room
app.get("/send/:sid/:msg", (req, res) => {
  var msg = req.params.msg;
  var sid = req.params.sid;
  
  var socket = io.sockets.sockets.get(sid);
  if (socket) {
    console.log(`send message ${msg} to socket ${sid}`);
    io.sockets.to(sid).emit("data", msg);
    res
      .status(200)
      .json({
        result: "OK",
        message: `message sent to socketid ${sid}`,
        users: users
      });
  } else {
    console.log("socket with id", sid, " not found");
    res
      .status(404)
      .json({
        result: "ERROR",
        message: `socket id ${sid} not found`,
        users: users
      });
  }
});

// Users array
var users = [];

const ns1 = io.of(/^\/ns-\d+$/);

ns1.on("connection", socket => {
  console.log("-> connection to ns1 received", socket.client.nsps.keys());
});

// middleware example
io.sockets.use((socket, next) => {
  console.log(`-> intercepted ${socket.id}`);

  next();
});

// Create new websocket
io.sockets.on("connection", function(socket) {
  console.log("-> connection established");

  socket.on("filter", (filterjson) => {
    console.log(
      "socket id",
      socket.id,
      "using json def:",
      filterjson
    );
    
    socket.app_data_filter = JSON.parse(filterjson);
  });

  socket.on("connected", function(data) {
    var msg = "socket connected " + socket.id;
    if (data) {
      msg += " msg: " + data;
    }
    console.log(msg);

    io.sockets.emit("broadcast", msg);
  });

  //user disconnection
  socket.on("disconnect", function() {
    //remove from array
    var pos = users.indexOf(socket.userid);
    if (pos >= 0) {
      users.splice(pos, 1);
    }

    var dcMsg = "- " + socket.userid + " disconnected -";
    io.sockets.emit("user-joined", dcMsg + " " + JSON.stringify(users)); // update list
    console.log(dcMsg);
  });
});

const accept = (socket, data) => {
  console.log("checking if socket.id", socket.id, "accept", data);
  let filter = socket.app_data_filter;
  
  if (!filter) // no filter means ignore all
    return false; 
  
  if (filter.type === "all")
    return true;
  
  if (filter.type === "sport") {
    if (data.event_type === filter.filter)
      return true;
    else
      return false;
  }
  
  if (filter.type === "eventids") {
    return filter.filter.find(item => { return item === data.event_id } );
  }
}

const event_data = [
  { event_id: 12345, event_type: "soccer", score: "1:1", timeremaining_seconds: "75" },
  { event_id: 12345, event_type: "soccer", score: "2:1", timeremaining_seconds: "45" },
  
  { event_id: 12346, event_type: "soccer", score: "2:3", timeremaining_seconds: "0" },
  
  { event_id: 12347, event_type: "basketball", score: "60:40", timeremaining_seconds: "233" },
  { event_id: 12347, event_type: "basketball", score: "70:65", timeremaining_seconds: "73" },
  { event_id: 12347, event_type: "basketball", score: "72:68", timeremaining_seconds: "13" },
  
  { event_id: 12348, event_type: "hockey", score: "3:1", timeremaining_seconds: "99" },
  { event_id: 12348, event_type: "hockey", score: "3:2", timeremaining_seconds: "89" },
  { event_id: 12348, event_type: "hockey", score: "3:3", timeremaining_seconds: "35" },
  
  { event_id: 12349, event_type: "hockey", score: "7:2", timeremaining_seconds: "723" },
  { event_id: 12349, event_type: "hockey", score: "7:3", timeremaining_seconds: "65" }
];
