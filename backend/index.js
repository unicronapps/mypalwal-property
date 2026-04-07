require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map(u => u.trim()) : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser requests (curl, Postman, Lambda warmup)
      if (!origin) return callback(null, true);
      const allowed =
        ALLOWED_ORIGINS.some(o => o === origin) ||
        /^https:\/\/[a-z0-9-]+\.mypalwal-property\.pages\.dev$/.test(origin);
      if (allowed) return callback(null, true);
      callback(new Error("CORS: origin not allowed"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/properties", require("./src/routes/properties"));
app.use("/api/media", require("./src/routes/media"));
app.use("/api/users", require("./src/routes/users"));
app.use("/api/enquiries", require("./src/routes/enquiries"));
app.use("/api/visits", require("./src/routes/visits"));
app.use("/api/payments", require("./src/routes/payments"));
app.use("/api/admin", require("./src/routes/admin"));
app.use("/api/search", require("./src/routes/search"));
app.use("/api/locations", require("./src/routes/locations"));
app.use(
  "/api/leads/find-property",
  require("./src/routes/leads-find-property"),
);
app.use("/api/leads/paperwork", require("./src/routes/leads-paperwork"));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: { status: "ok", timestamp: new Date().toISOString() },
  });
});

app.get("/test", (req, res) => {
  res.json({ success: true, message: "warm" });
});

app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: "Route not found", code: "NOT_FOUND" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    code: err.code || "INTERNAL_ERROR",
  });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}
