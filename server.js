const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8,
});

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const port = process.env.PORT;
const users = {};
const rooms = {};

io.on("connection", (socket) => {
  socket.on("login", async ({ id }) => {
    // console.log(User Id after login ===>>>${id})
    try {
      socket.join(id); //personal message
      io.to(id).emit("loginSuccessfully", { message: "Welcome User", id });
      users[socket.id] = id;
      console.log(users);
    } catch (err) {
      console.log(err);
      io.to(socket.id).emit("error", err);
    }
  });

  socket.on("createStory", async (data) => {
    let i = 0;
    rooms[socket.id] = [];
    rooms[socket.id].push(data["roomId"]);
    socket.join(data["roomId"]);
    console.log(data["hostname"]);
    console.log("user created room id: ", data["roomId"]);
    try {
      for (let user of data["participants"]) {
        if (i == 0) {
          i += 1;
          continue;
        }
        io.to(user["_id"]).emit("storyInvitation", { data });
      }
    } catch (error) {}
  });

  socket.on("joinRoom", async (data) => {
    try {
      for (let room of data["rooms"]) {
        console.log(room);
        socket.join(room);
      }
    } catch (error) {}
  });

  socket.on("addParticipants", async (data) => {
    try {
      for (let user of data["participants"]) {
        io.to(user["_id"]).emit("storyInvitation", { data });
      }
    } catch (error) {}
  });

  socket.on("removeParticipants", async (data) => {
    try {
      io.to(data["participant"]).emit("removeInvitation", { data });
    } catch (error) {}
  });

  socket.on("acceptInvitation", async (data) => {
    const roomId = data["roomId"];
    console.log("user acceptInvitation room id: ", data["roomId"]);
    socket.join(data["roomId"]);
    try {
      console.log(io.sockets.adapter.rooms.has(roomId));
      io.to(data["roomId"]).emit("invitationAccepted", { roomId });
    } catch (error) {
      console.log("error in invitaion accept emit: ", error);
    }
  });

  socket.on("rejectInvitation", async (data) => {
    const roomId = data["roomId"];
    console.log("user rejectInvitation room id: ", data["roomId"]);
    try {
      io.to(data["roomId"]).emit("invitationRejected", { roomId });
    } catch (error) {
      io.to(socket.id).emit("error", err);
    }
  });

  socket.on("startStory", async (data) => {
    const roomId = data["roomId"];
    try {
      io.to(data["roomId"]).emit("storyStarted", { roomId });
    } catch (error) {}
  });

  socket.on("sendMessage", async (data) => {
    console.log("user send a messge in room: ", data["roomId"]);
    const roomId = data["roomId"];
    try {
      io.to(roomId).emit("messageSend", { roomId });
    } catch (error) {}
  });

  socket.on("escapeTurn", async (data) => {
    const roomId = data["roomId"];
    try {
      io.to(roomId).emit("turnIsEscaped", { roomId });
    } catch (error) {}
  });
});

server.listen(port, () => console.log("server running on port:" + port));
