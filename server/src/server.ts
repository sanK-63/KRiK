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
initSocket(server);

server.listen(config.port, "0.0.0.0", () => {
    console.log(`Server started on 0.0.0.0:${config.port}`);
});
