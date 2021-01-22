const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)


users = {};
rooms = {};


app.use('/', express.static('public'))

io.on('connection', (socket) => {

  //Set username
  console.log('A user connected');

  socket.on('new-user', (roomId, name) => {
    users[socket.id] = name
    socket.to(roomId).broadcast.emit('user-connected', name)
    socket.to(roomId).broadcast.emit("update-users-list", users)
  })

  socket.on('disconnect', () => {
    socket.broadcast.emit('user-disconnected', users[socket.id])
    delete users[socket.id]
    socket.broadcast.emit("update-users-list", users)
    
  })

  socket.on('delete', roomId =>{
    if (rooms[roomId] > 0){
      rooms[roomId] --;
      console.log(rooms[roomId])
    }
  })

  socket.on('users-request', function() {
    socket.emit('return-users', users);
  });

  socket.on('setUsername', function(data) {
    console.log(data);
      
    if(users.indexOf(data) > -1) {
        socket.emit('userExists', data + ' username is taken! Try some other username.');
    } else {
        //users.push(data);
        socket.emit('userSet', {username: data});
    }
  });

  socket.on('send-chat-message', (roomId, message) => {
    console.log(message)
    socket.to(roomId).broadcast.emit('chat-message', {message: message, name: users[socket.id]})
  })

  socket.on('join', (roomId) => {
    
    // These events are emitted only to the sender socket.
    if (rooms[roomId] == undefined || rooms[roomId] == 0) {
      console.log(`Creating room ${roomId} and emitting room_created socket event`)
      socket.join(roomId)
      socket.emit('room_created', roomId)
      rooms[roomId] = 1
      console.log(rooms[roomId])
    
    } else if (rooms[roomId] < 2) {
      console.log(`Joining room ${roomId} and emitting room_joined socket event`)
      socket.join(roomId)
      socket.emit('room_joined', roomId)
      rooms[roomId] ++
      console.log(rooms[roomId])
    } else {
      console.log(`Can't join room ${roomId}, emitting full_room socket event`)
      socket.emit('full_room', roomId)
    }
    socket.emit('message', 'message')
  })

  // These events are emitted to all the sockets connected to the same room except the sender.
  socket.on('start_call', (roomId) => {
    console.log(`Broadcasting start_call event to peers in room ${roomId}`)
    socket.broadcast.to(roomId).emit('start_call')
  })
  socket.on('webrtc_offer', (event) => {
    console.log(`Broadcasting webrtc_offer event to peers in room ${event.roomId}`)
    socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp)
  })
  socket.on('webrtc_answer', (event) => {
    console.log(`Broadcasting webrtc_answer event to peers in room ${event.roomId}`)
    socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp)
  })
  socket.on('webrtc_ice_candidate', (event) => {
    console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`)
    socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event)
  })
})

// START THE SERVER =================================================================
const port = process.env.PORT || 3000
server.listen(port, () => {
  console.log(`Express server listening on port ${port}`)
})
