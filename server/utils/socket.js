let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join office-specific room
    socket.on('join:office', (officeId) => {
      socket.join(`office:${officeId}`);
      console.log(`Socket ${socket.id} joined room office:${officeId}`);
    });

    // Join ministry room (all offices)
    socket.on('join:ministry', () => {
      socket.join('ministry');
      console.log(`Socket ${socket.id} joined ministry room`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
};

module.exports = { initSocket, getIO };
