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

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
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

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/software", softwareRoutes);

export default app;
