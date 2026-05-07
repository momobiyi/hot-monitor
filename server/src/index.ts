import { createServer } from "node:http";
import { Server } from "socket.io";
import { config } from "./config";
import { prisma } from "./db";
import { createApp } from "./app";
import { ScannerService } from "./services/scanner";
import { startScheduler } from "./scheduler";

const scanner = new ScannerService(prisma);
const app = createApp(prisma, scanner);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: config.clientOrigin }
});
scanner.setSocketServer(io);
startScheduler(scanner);

httpServer.listen(config.port, () => {
  console.log(`Hot Monitor API listening on http://127.0.0.1:${config.port}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
