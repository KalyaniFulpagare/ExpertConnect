export const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    socket.on("join-expert", (expertId) => {
      if (expertId) {
        socket.join(`expert:${expertId}`);
      }
    });

    socket.on("leave-expert", (expertId) => {
      if (expertId) {
        socket.leave(`expert:${expertId}`);
      }
    });

    socket.on("join-bookings", (email) => {
      if (email) {
        socket.join(`bookings:${String(email).toLowerCase()}`);
      }
    });

    socket.on("leave-bookings", (email) => {
      if (email) {
        socket.leave(`bookings:${String(email).toLowerCase()}`);
      }
    });
  });
};
