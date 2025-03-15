const formatDate = function (timestamp) {
  // Formats a given timestamp into a human-readable string using Moment.js
  return moment(timestamp).format("MMMM Do YYYY, h:m a");
};

const socket = io(); // Initializes the socket connection

// Selects the message form, input field, send button, location button, and messages container
const messageFormEl = document.getElementById("message-form");
const messageFormInputEl = messageFormEl.querySelector("input");
const messageFormBtntEl = messageFormEl.querySelector("button");
const sendLocationEl = document.getElementById("send-location");
const messagesEl = document.getElementById("messages");
const sidebarEl = document.getElementById("sidebar");

// Selects the message templates from the HTML
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationMessageTemplate = document.getElementById(
  "location-message-template"
).innerHTML;

const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

// options

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// auto ascroll
const autoScroll = () => {
  // new message element
  const newMessageEl = messagesEl.lastElementChild;

  // height of new message
  const newMessageElStyles = getComputedStyle(newMessageEl);
  const newMessageElMargin = parseInt(newMessageElStyles.marginBottom);
  const newMessageHeight = newMessageEl.offsetHeight + newMessageElMargin;

  console.log(newMessageHeight);

  // visible height
  const visibleHeight = messagesEl.scrollHeight;

  // height of messages container
  const containerHeight = messagesEl.scrollHeight;

  //
  const scrollOffset = messagesEl.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
};

// Listens for 'locationMessage' event from the server and renders it in the chat
socket.on("locationMessage", ({ username, locationUrl, createdAt }) => {
  console.log(locationUrl); // Logs the received location URL
  const html = Mustache.render(locationMessageTemplate, {
    locationUrl, // The URL of the shared location
    createdAt: formatDate(createdAt), // Formats the timestamp before displaying
    username,
  });
  messagesEl.insertAdjacentHTML("beforeend", html); // Adds the message to the chat

  autoScroll()
});

socket.on("roomUpdate", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });
  sidebarEl.innerHTML = html;
});

// Listens for 'message' event from the server and renders it in the chat
socket.on("message", ({ username, text, createdAt }) => {
  console.log(username); // Logs the received message text
  const html = Mustache.render(messageTemplate, {
    message: text, // Message content
    createdAt: formatDate(createdAt), // Formats the timestamp before displaying
    username,
  });
  messagesEl.insertAdjacentHTML("beforeend", html); // Adds the message to the chat

  autoScroll()
});

// Handles form submission for sending messages
messageFormEl.addEventListener("submit", (e) => {
  e.preventDefault(); // Prevents default form submission behavior

  messageFormBtntEl.setAttribute("disabled", "disabled"); // Disables the button to prevent duplicate submissions

  const message = e.target.elements.message.value; // Retrieves the message text from the input field

  socket.emit("sendMessage", message, (error) => {
    messageFormBtntEl.removeAttribute("disabled"); // Re-enables the send button
    messageFormInputEl.value = ""; // Clears the input field
    messageFormInputEl.focus(); // Refocuses the input field

    if (error) {
      return console.log(error); // Logs error if sending fails
    }
    console.log("Message Delivered!"); // Logs successful delivery
  });
});

// Handles sending the user's location
sendLocationEl.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser"); // Alerts if geolocation is unsupported
  }

  sendLocationEl.setAttribute("disabled", "disabled"); // Disables the button while processing

  navigator.geolocation.getCurrentPosition((position) => {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    socket.emit("sendLocation", location, () => {
      sendLocationEl.removeAttribute("disabled"); // Re-enables the location button
      console.log("Location shared!"); // Logs successful location sharing
    });
  });
});

socket.emit("joinRoom", { room, username }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
