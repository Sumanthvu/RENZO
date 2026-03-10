/**
 * Socket.io event handlers
 * @param {import('socket.io').Server} io
 */
const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // TODO: register your socket events here
    // socket.on('event_name', (data) => { ... });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

export default registerSocketHandlers;
