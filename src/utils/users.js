let users = [];

const addUser = ({ id, username, room }) => {
  // clean the data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // vallidate the user

  if (!username || !room) {
    return { error: `Username and room is requied` };
  }

  // check for existing user
  const existingUser = users.find(
    (user) => user.username === username && user.room === room
  );

  if (existingUser) {
    return { error: `user already exist` };
  }

  // store user
  const user = { id, username, room };
  users.push(user);

  return {
    user,
  };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0]; // Return the removed user
  }
  return undefined;
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

const getUsersInRoom = (room) => {
  room = room.trim().toLowerCase();
  return users.filter((user) => user.room === room);
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
};
