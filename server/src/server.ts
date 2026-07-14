import { migrate } from "./database/migrate";
import { seedDocTemplates } from "./seedDocTemplates";
import { config } from "./config";
import app from "./app";

migrate();
seedDocTemplates();

app.listen(config.port, "0.0.0.0", () => {
    console.log(`Server started on 0.0.0.0:${config.port}`);
});
