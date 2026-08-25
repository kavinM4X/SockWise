import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import backupRoutes from "./routes/backupRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import { initHealthCheckScheduler } from "./services/scheduler.js";
import swaggerUi from "swagger-ui-express";
import compression from "compression";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDocument = JSON.parse(fs.readFileSync(new URL('./swagger.json', import.meta.url)));

dotenv.config();

// Environment Validation
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
const requiredEnvVars = ['JWT_SECRET', 'PORT'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (!mongoUri) missingVars.push('MONGO_URI / MONGODB_URI');
if (missingVars.length > 0) {
  console.error(`FATAL ERROR: Missing environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

connectDB();

const app = express();

// Enable Response Compression (Gzip / Brotli)
app.use(compression());

// Security Middleware
app.use(helmet());

// Production & Development CORS Configuration
app.use(cors({
  origin: true,
  credentials: true,
  maxAge: 86400, // Cache CORS preflight OPTIONS check for 24 hours
}));

// Request Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', globalLimiter);

// Auth Route-Specific Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // limit each IP to 50 login/register requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/", (req, res) => {
  res.send("SockWise Backend is Running 🚀");
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/backup", backupRoutes);

// Serve static frontend dist in production/monorepo deployment
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  // Initialize automated 4-hour health-check scheduler
  initHealthCheckScheduler();
});