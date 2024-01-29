const app = require("./app");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const dotenv = require("dotenv");
dotenv.config({path:"./config.env"})
const port = process.env.PORT;
const users  = {};
const rooms = {};


io.on("connection", socket => {
  io.emit("welcome",{data:"welcome Ansh from server"});
  console.log("socket id:",socket.id);
  socket.on("joinRoom",async({roomId})=>{
    try{
    rooms[users[socket.id]] = [];
    rooms[users[socket.id]].push(roomId);
    socket.join(roomId);
  }catch(err){
      console.log(err)
      io.to(socket.id).emit("error",err);
    }
  })
  socket.on("login",async({id})=>{
    try{
      socket.join(id);
      users[socket.id] = id;
      console.log(users);
    }catch(err){
      console.log(err);
      io.to(socket.id).emit("error",err);
    }
  })

  socket.on("message",async({roomId,message,senderId})=>{
    try {
      io.to(roomId).emit("sendMessage",{message,senderId});
      // io.emit("welcome",{message:"hello Ansh from server"})
      console.log(roomId,message,senderId)
    } catch (error) {
      
    }
  })

  socket.on("disconnect", async({id}) => {
    console.log("user is disconnected: ",socket.id);
    // for(let i of rooms[users[socket.id]]){
    //   io.to(i).emit("user-left",{})
    // }
    // delete users[socket.id];
    // console.log(users);
  });
});

server.listen(port, () => console.log("server running on port:" + port));