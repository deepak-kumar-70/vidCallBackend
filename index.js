import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://vid-call-eight.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});


let users={};
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
socket.on("join::user", ({ name }) => {
    socket.username = name;
    users[socket.id] = { name };
    io.emit("user::joined", users);
  });

  socket.on("call::offer", ({ offer, to, from }) => {
    const receiverSocket = findSocketByName(to);
    if (receiverSocket) {
      io.to(receiverSocket.id).emit("call::offer", { offer, from });
    }
  });

  socket.on("call::answer", ({ answer, to, from }) => {
    const callerSocket = findSocketByName(to);
    if (callerSocket) {
      io.to(callerSocket.id).emit("call::answer", { answer, from });
    }
  });
 socket.on("call::reject", ({ to }) => {
  const targetSocket = findSocketByName(to);
  if (targetSocket) {
    io.to(targetSocket.id).emit("call::reject");
  }
});

  socket.on("ice-candidate", ({ candidate, to }) => {
    const targetSocket = findSocketByName(to);
    if (targetSocket) {
      io.to(targetSocket.id).emit("ice-candidate", { candidate });
    }
  });
 socket.on("call::end", ({ to }) => {
  const targetSocket = findSocketByName(to);
  if (targetSocket) {
    io.to(targetSocket.id).emit("call::end");
  }
});

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("user::joined", users);
  });

  function findSocketByName(name) {
    return Array.from(io.sockets.sockets.values()).find(
      (s) => s.username === name
    );
  }
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
