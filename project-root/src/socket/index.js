const { Server } = require('socket.io');

let io;
function initSocket(server) {
  io = new Server(server, { cors: { origin: '*' } });
  io.on('connection', socket => {
    console.log('Socket connected:', socket.id);
  });
  return io;
}

module.exports = { io: () => io, initSocket };