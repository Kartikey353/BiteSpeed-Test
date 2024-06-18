import "dotenv/config";
import "module-alias/register";
import validateEnv from "@/utils/ValidateEnv";
import App from "./app";
import HealthController from "@/resources/healthCheck/heath.controller";
import asignmentRoutes from "./resources/Assignment/routes/assignment.routes";

validateEnv();
const app = new App(
  [new HealthController(), new asignmentRoutes()],
  Number(process.env.PORT)
);

app.listen();
