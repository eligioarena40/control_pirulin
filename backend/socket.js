let io;

export const initSocket = (serverInstance) => {
  io = serverInstance;
  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io no está inicializado");
  }
  return io;
};