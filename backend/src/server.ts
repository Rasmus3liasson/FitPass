import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import apiRoutes from "./routes/index";
import { runMigrations } from "./services/migrations";
import { stripeService } from "./services/stripe";

// Load environment variables from root directory
dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * CRITICAL: Stripe webhook endpoint MUST be defined BEFORE any body parsing middleware
 * 
 * Stripe webhooks require the raw request body (as Buffer) to verify the signature.
 * If the body is parsed as JSON before verification, the signature check will fail.
 * 
 * This route MUST:
 * 1. Be defined before express.json() or body-parser middleware
 * 2. Use express.raw() to preserve the raw body as a Buffer
 * 3. Pass the raw Buffer to stripe.webhooks.constructEvent()
 */
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      return res.status(400).json({ error: "Missing Stripe signature" });
    }

    if (!Buffer.isBuffer(req.body)) {
      return res
        .status(400)
        .json({ error: "Webhook body must be raw Buffer" });
    }

    try {
      await stripeService.handleWebhook(req.body, signature);
      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error.message);
      res.status(400).json({ error: error.message });
    }
  }
);

// Security middleware (helmet)
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

/**
 * Body parsing middleware for all OTHER routes (NOT the webhook)
 * 
 * express.json() parses incoming requests with JSON payloads.
 * This MUST be defined AFTER the webhook route to avoid interfering
 * with Stripe's signature verification which requires the raw body.
 */
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
app.use("/api/stripe", apiRoutes);

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
// Start server
app.listen(PORT, async () => {
  await runMigrations();
  
  console.log(`🚀 Server running on port ${PORT}`);

  try {
    // Import sync services dynamically to avoid circular deps
    const { AutoSyncService } = await import("./services/autoSync");
    const { syncScheduler } = await import("./services/syncScheduler");
    const { setupDatabaseNotificationListener } = await import("./services/databaseNotificationListener");

    // Sync products (membership plans) from DB to Stripe
    await stripeService.syncProductsWithDatabase();

    // Comprehensive sync (Stripe → DB)
    const syncResult = await AutoSyncService.performComprehensiveSync();

    // Startup sync (DB → Stripe)
    await syncScheduler.startupSync();

    // Start automatic sync scheduler
    syncScheduler.startAutoSync();

    // Setup database notification listener for push notifications
    await setupDatabaseNotificationListener();

  } catch (error) {
    console.error("Failed during initial sync:", error);
  }
});


// Graceful shutdown
process.on("SIGTERM", () => {
  // Stop sync scheduler before shutdown
  import("./services/syncScheduler").then(({ syncScheduler }) => {
    syncScheduler.stopAutoSync();
    process.exit(0);
  }).catch(() => {
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  // Stop sync scheduler before shutdown
  import("./services/syncScheduler").then(({ syncScheduler }) => {
    syncScheduler.stopAutoSync();
    process.exit(0);
  }).catch(() => {
    process.exit(0);
  });
});

export default app;
