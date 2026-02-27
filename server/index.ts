import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { authRoutes } from "./routes/auth";
import { centerRoutes } from "./routes/centers";
import { enquiryRoutes } from "./routes/enquiries";
import { educatorRoutes } from "./routes/educators";
import { familyRoutes } from "./routes/families";
import { adminRoutes } from "./routes/admin";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/centers", centerRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/educators", educatorRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/admin", adminRoutes);

// In production, serve built Vite files
if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`LittleBridge API running on port ${PORT}`);
});
