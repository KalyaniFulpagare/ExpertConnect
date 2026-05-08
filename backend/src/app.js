import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { createCorsOptions } from "./config/cors.js";
import expertRoutes from "./routes/expertRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

export const createApp = (io) => {
  const app = express();

  app.use(cors(createCorsOptions()));
  app.use(helmet());
  app.use(express.json());
  app.use(morgan("dev"));

  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  app.get("/health", (req, res) => {
    res.json({ message: "Expert session booking API is healthy." });
  });

  app.use("/experts", expertRoutes);
  app.use("/bookings", bookingRoutes);

  if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));

    app.get("*", (req, res, next) => {
      if (
        req.path.startsWith("/experts") ||
        req.path.startsWith("/bookings") ||
        req.path.startsWith("/health")
      ) {
        next();
        return;
      }

      res.sendFile(path.join(frontendDistPath, "index.html"));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
