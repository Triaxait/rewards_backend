import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import summaryRoutes from "./routes/summary.routes.js";
import qrtokenroutes from "./routes/qr.routes.js";
import cookieParser from "cookie-parser";
import tokenroutes from "./routes/token.routes.js";
import adminroutes from "./routes/admin.routes.js";
import staffroutes from "./routes/staff.routes.js";
import customerroutes from "./routes/customer.routes.js";
import testRedisRouter from "./routes/testredis.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:5173", // Vite default
  credentials: true,
}));

// mount auth routes
app.use("/api/auth", authRoutes);
app.use("/api", summaryRoutes);
app.use("/api", qrtokenroutes);
app.use("/api",tokenroutes);
app.use("/api/admin",adminroutes);
app.use("/api/staff",staffroutes);
app.use("/api/customer",customerroutes);
app.use("/test", testRedisRouter);

export default app;
