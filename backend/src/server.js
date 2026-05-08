import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { createCorsOptions } from "./config/cors.js";
import { connectDatabase } from "./config/db.js";
import { registerSocketHandlers } from "./socket/socketServer.js";
import { seedExpertsIfEmpty } from "./services/seedService.js";

const port = Number(process.env.PORT || 5000);

const bootstrap = async () => {
  await connectDatabase();

  if (String(process.env.AUTO_SEED || "true").toLowerCase() === "true") {
    await seedExpertsIfEmpty();
  }

  const app = createApp();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: createCorsOptions()
  });
  app.set("io", io);
  registerSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
