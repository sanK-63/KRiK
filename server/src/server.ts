import { migrate } from "./database/migrate";
import { config } from "./config";
import app from "./app";

migrate();

app.listen(config.port, () => {
    console.log(`Server started on ${config.port}`);
});
