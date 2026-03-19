require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
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
app.use("/api/notifications", require("./src/routes/notifications"));
app.use("/api/payments", require("./src/routes/payments"));
app.use("/api/admin", require("./src/routes/admin"));
app.use("/api/search", require("./src/routes/search"));
app.use("/api/locations", require("./src/routes/locations"));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: { status: "ok", timestamp: new Date().toISOString() },
  });
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
