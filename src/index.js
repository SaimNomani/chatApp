const app = require("./app.js"); // Import the Express application instance from app.js
const http = require("http"); // Import the built-in Node.js HTTP module to create a server
const socketio = require("socket.io"); // Import the Socket.io library to enable real-time WebSocket communication
const Filter = require("bad-words"); // Import the 'bad-words' library to filter out profanity from messages
const { generateMessages } = require("./utils/messages.js"); // Import a utility function to generate message objects
const { generateLocationMessages } = require("./utils/location.js"); // Import a utility function to generate location messages
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users.js"); // Import user management functions for adding, removing, and retrieving users

const server = http.createServer(app); // Create an HTTP server using the Express app
const io = socketio(server); // Attach a new Socket.io instance to the HTTP server

const port = process.env.PORT || 3000; // Set the server port, using an environment variable if available, otherwise default to 3000

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log("New WebSocket connection"); // Log when a new user connects

  /*
  The following commented-out lines were initially used for basic message broadcasting when a new user joined:
  - `socket.emit("message", generateMessages("Welcome!"));` -> Sends a welcome message to the newly connected client.
  - `socket.broadcast.emit("message", generateMessages("A new user has joined!"));` -> Informs all other connected users about the new user.
  These were replaced by a more structured "joinRoom" event.
  */

  socket.on("joinRoom", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room }); // Attempt to add the user to the room

    if (error) {
      return callback(error); // If there's an error (e.g., username taken), return it via the callback
    }

    socket.join(user.room); // Join the specified chat room

    socket.emit("message", generateMessages("Admin", "Welcome!")); // Send a welcome message to the new user

    // Notify other users in the room that a new user has joined
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessages("Admin", `${user.username} has joined!`)
      );

    io.to(user.room).emit("roomUpdate", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback(); // Execute callback to acknowledge successful joining
  });

  // Listen for messages sent by a client
  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter(); // Create a new instance of the 'bad-words' filter

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed"); // Reject the message if it contains profanity
    }

    const user = getUser(socket.id);

    io.to(user.room).emit("message", generateMessages(user.username, message)); // Broadcast the message to all connected clients in room
    callback(); // Execute callback to acknowledge successful message sending
  });

  // Listen for location sharing from a client
  socket.on("sendLocation", (location, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessages(
        user.username,
        `https://google.com/maps?q=${location.latitude},${location.longitude}` // Generate a Google Maps link using the provided latitude and longitude
      )
    );

    callback(); // Execute callback to confirm successful location sharing
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    const user = removeUser(socket.id); // Remove the user from the active users list
    console.log(user);
    if (user) {
      // Notify all users in the room that a user has left
      io.to(user.room).emit(
        "message",
        generateMessages("Admin", `${user.username} has left!`)
      );
      io.to(user.room).emit("roomUpdate", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

// Start the server and listen for incoming connections
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
