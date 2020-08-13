var waitingList = [];

var rooms = [
  {
    id: 1,
    name: "Owen's Room",
    playerOne: { name: "Nix", score: 1 },
    playerTwo: { name: "enemy", score: 2 },
  },
  {
    id: 3,
    name: "Owen's Room",
    playerOne: { name: "Nix", score: 1 },
    playerTwo: { name: "enemy", score: 2 },
  },
  {
    id: 2,
    name: "Owen's Room",
    playerOne: { name: "Nix", score: 1 },
    playerTwo: { name: "enemy", score: 2 },
  },
  {
    id: 4,
    name: "Owen's Room",
    playerOne: { name: "Nix", score: 1 },
    playerTwo: { name: "enemy", score: 2 },
  },
];


module.exports = function (io) {
  io.on("connection", (socket) => {
    //Return current active rooms
    socket.on("getRooms", () => {
      socket.emit("getRooms", rooms);
    });

    //Return current players waiting to play
    socket.on("getWaiting", () => {
      socket.emit("getWaiting", waitingList);
    });

    //Add a user to the waiting list
    socket.on("addWaiting", (user, callback) => {
      const isAlreadyOnList = waitingList.filter((element) => element.name === user);
      if (isAlreadyOnList.length === 1) {
        callback({ user: user, status: false, id: null });
      } else {
        waitingList.push({ name: user, id: socket.id });
        //Notice that id is socket.id, this is important for starting the game.
        callback({ user: user, status: true, id: socket.id });
        //Join socket to room
        socket.join(`${socket.id}`);
      }
    });

    //Remove a user from the waiting list
    socket.on("removeWaiting", (user) => {
      if (!user) return;
      const index = waitingList.findIndex(entry => entry.name === user);
      if (index >= 0) waitingList.splice(index, 1);
    })

    //Start a game between two users.
    //playerOne is the waiting player.
    socket.on("startGame", (data, callback) => {
      const playerOneOnList = waitingList.filter((element) => element.name === data.playerOne);
      if (playerOneOnList.length === 0) {

        //User is not waiting = probably a bug, can't start game.
        callback({status: false});

      } else {

        const playerOneId = (playerOneOnList[0]).id;
        const playerTwoId = socket.id;

        console.log(playerOneId, playerTwoId);
        console.log(io.sockets.connected[playerOneId]);
        callback({status: true});

      }
    });

    socket.on("removeById", () => {
      console.log("test");
      const id = waitingList.findIndex(entry => entry.id === socket.id);
      if (id >= 0) waitingList.splice(id, 1);
    })
  });
};
