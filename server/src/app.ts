import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import templatesRoutes from "./routes/templates";
import recipesRoutes from "./routes/recipes";
import constitutionRoutes from "./routes/constitution";

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

export default app;
