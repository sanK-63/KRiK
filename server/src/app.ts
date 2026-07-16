import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import templatesRoutes from "./routes/templates";
import recipesRoutes from "./routes/recipes";
import constitutionRoutes from "./routes/constitution";
import moviesRoutes from "./routes/movies";
import eloRoutes from "./routes/elo";
import tournamentsRoutes from "./routes/tournaments";
import gamesRoutes from "./routes/games";
import tournamentTemplatesRoutes from "./routes/tournamentTemplates";
import notificationsRoutes from "./routes/notifications";
import libraryRoutes from "./routes/library";
import eventsRoutes from "./routes/events";
import memesRoutes from "./routes/memes";
import tmdbRoutes from "./routes/tmdb";
import forumRoutes from "./routes/forum";
import adminRoutes from "./routes/admin";
import messagesRoutes from "./routes/messages";
import softwareRoutes from "./routes/software";
import searchRoutes from "./routes/search";
import violationsRoutes from "./routes/violations";
import logsRoutes from "./routes/logs";

const app = express();

app.use(cors());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "ws:", "wss:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Corporate Portal API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/templates", templatesRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/constitution", constitutionRoutes);
app.use("/api/movies", moviesRoutes);
app.use("/api/elo", eloRoutes);
app.use("/api/tournaments", tournamentsRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/tournament-templates", tournamentTemplatesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/memes", memesRoutes);
app.use("/api/tmdb", tmdbRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/violations", violationsRoutes);
app.use("/api/logs", logsRoutes);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/software", softwareRoutes);

// Serve static frontend
const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
    res.sendFile(path.join(clientDist, "index.html"));
});

export default app;
