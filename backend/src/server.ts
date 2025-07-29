import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import stripeRoutes from "./routes/stripe";
import { runMigrations } from "./services/migrations";
import { stripeService } from "./services/stripe";

// Load environment variables from root directory
dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:8081",
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use("/webhook", express.raw({ type: "application/json" })); // Raw body for webhooks
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/stripe", stripeRoutes);

// Stripe webhook endpoint
app.post("/webhook", async (req, res) => {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    return res.status(400).json({ error: "Missing Stripe signature" });
  }

  try {
    await stripeService.handleWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Error handling middleware
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", error);

    if (error.type === "StripeCardError") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : error.message,
    });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, async () => {
  await runMigrations();
  
  // Start automatic sync scheduler
  try {
    const { syncScheduler } = await import("./services/syncScheduler");
    syncScheduler.startAutoSync();
    console.log("🕐 Auto-sync scheduler started automatically");
  } catch (error) {
    console.error("❌ Failed to start auto-sync scheduler:", error);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  // Stop sync scheduler before shutdown
  import("./services/syncScheduler").then(({ syncScheduler }) => {
    syncScheduler.stopAutoSync();
    console.log("🛑 Auto-sync scheduler stopped");
    process.exit(0);
  }).catch(() => {
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  // Stop sync scheduler before shutdown
  import("./services/syncScheduler").then(({ syncScheduler }) => {
    syncScheduler.stopAutoSync();
    console.log("🛑 Auto-sync scheduler stopped");
    process.exit(0);
  }).catch(() => {
    process.exit(0);
  });
});

export default app;
