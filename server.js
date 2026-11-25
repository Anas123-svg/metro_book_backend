const express = require("express");
const cors = require("cors");
const app = express();
const { connectDB } = require("./config/db"); 
const corporateHostRoutes = require("./routes/corporateHostRoutes");
const corporateBookRoutes = require("./routes/corporateBookRoutes");
const corporateHostCustomerRoutes = require("./routes/corporateHostCustomerRoutes");
const corporateBookCustomerRoutes = require("./routes/corporateBookCustomerRoutes");
const corporateHostListingRoutes = require("./routes/corporateHostListingRoutes");
const bookingRoutes = require("./routes/Booking");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/UserRoutes");

app.use(cors());

// Parse JSON bodies
app.use(express.json());

// -------------------- ROUTES --------------------
app.use("/api", corporateHostRoutes);
app.use("/api", corporateBookRoutes);
app.use("/api/cb", corporateHostCustomerRoutes);
app.use("/api/book", corporateBookCustomerRoutes);
app.use("/api", corporateHostListingRoutes);
app.use("/api", bookingRoutes);
app.use("/api", adminRoutes);
app.use("/api", userRoutes);
// Compatibility mounts for clients that call legacy root paths like /books or /hosts.
app.use(corporateHostRoutes);
app.use(corporateBookRoutes);
app.use(corporateHostCustomerRoutes);
app.use(corporateBookCustomerRoutes);
app.use(corporateHostListingRoutes);
app.use(bookingRoutes);
app.use(adminRoutes);
app.use(userRoutes);

// -------------------- SERVER --------------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB(); // connect Sequelize to Postgres
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
