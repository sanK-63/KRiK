import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
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
import archiveRoutes from "./routes/archive";

const app = express();

app.use((req, res, next) => {
    if (req.url.startsWith("/socket.io")) return next();
    const origin = req.headers.origin || "http://localhost:5173";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") { res.sendStatus(204); return; }
    next();
});
app.use((req, res, next) => {
    if (req.url.startsWith("/socket.io")) return next();
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:", "http:"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
            },
        },
        crossOriginEmbedderPolicy: false,
    })(req, res, next);
});
app.use((req, res, next) => {
    if (req.url.startsWith("/socket.io")) return next();
    cookieParser()(req, res, next);
});
app.use((req, res, next) => {
    if (req.url.startsWith("/socket.io")) return next();
    express.json()(req, res, next);
});
app.use((req, res, next) => {
    if (req.url.startsWith("/socket.io")) return next();
    morgan("dev")(req, res, next);
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Corporate Portal API" });
});

app.get("/api/time", (_req, res) => {
    res.json({ serverTime: Date.now() });
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
app.use("/api/archive", archiveRoutes);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/software", softwareRoutes);

// Serve static frontend
const clientDist = path.resolve(__dirname, "../../client/dist");
app.use((req, res, next) => {
    if (req.url.startsWith("/socket.io")) return next();
    express.static(clientDist)(req, res, next);
});
app.get("*", (req, res) => {
    if (req.url.startsWith("/socket.io")) return;
    if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
    res.sendFile(path.join(clientDist, "index.html"));
});

export default app;
