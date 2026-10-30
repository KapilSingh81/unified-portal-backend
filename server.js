import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.config.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.config.js";
import companyRouter from "./routes/companyRoutes.js";
import domainRouter from "./routes/domainRoutes.js";
import moduleRouter from "./routes/moduleRoutes.js";
import menuRouter from "./routes/menuRoutes.js";
import roleRouter from "./routes/roleRoutes.js";
import userRouter from "./routes/userRoutes.js";
import parentUserRouter from "./routes/parentUserRoutes.js";
import roleMenuRouter from "./routes/roleMenuRoutes.js";
import rolePermissionRouter from "./routes/rolePermissionRoutes.js";
import logRouter from "./routes/logRoutes.js";
import "./models/index.js"; 

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => res.send("Api is working"));
app.use('/api/company', companyRouter);
app.use('/api/domain', domainRouter);
app.use("/api/module", moduleRouter);
app.use("/api/menu", menuRouter);
app.use("/api/role", roleRouter);
app.use("/api/user", userRouter);
app.use("/api/parent-user", parentUserRouter);
app.use("/api/role-menu", roleMenuRouter);
app.use("/api/role-permission", rolePermissionRouter);
app.use("/api/log", logRouter);


const PORT = process.env.PORT || 4000;

connectDB()
    .then(() => {
        app.listen(PORT, () => console.log(`Api is listening on http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error("❌ DB Error:", err.message);
        process.exit(1);
    });