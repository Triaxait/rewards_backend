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
import analyticsRoutes from "./routes/summary.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true,
}));

app.set("trust proxy", 1);

// mount auth routes
app.use("/api/auth", authRoutes);
app.use("/api", summaryRoutes);
app.use("/api", qrtokenroutes);
app.use("/api",tokenroutes);
app.use("/api/admin",adminroutes);
app.use("/api/staff",staffroutes);
app.use("/api/customer",customerroutes);
app.use("/api/analytics", analyticsRoutes);



export default app;
