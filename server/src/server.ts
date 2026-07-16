import http from "http";
import { migrate } from "./database/migrate";
import { seedDocTemplates } from "./seedDocTemplates";
import { seedMovies } from "./seedMovies";
import { config } from "./config";
import app from "./app";
import { initSocket } from "./socket";

migrate();
seedDocTemplates();
seedMovies();

const server = http.createServer(app);
const io = initSocket(server);

io.engine.on("connection_error", (err) => {
    console.error("[Socket] Connection error:", err.message);
});

process.on("uncaughtException", (err) => {
    console.error("[Server] Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
    console.error("[Server] Unhandled rejection:", reason);
});

server.listen(config.port, "0.0.0.0", () => {
    console.log(`Server started on 0.0.0.0:${config.port}`);
});
