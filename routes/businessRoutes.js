const express = require("express");
const router = express.Router();
const corporateHostRoutes = require("./corporateHostRoutes");
const corporateBookRoutes = require("./corporateBookRoutes");
const corporateHostCustomerRoutes = require("./corporateHostCustomerRoutes");
const corporateBookCustomerRoutes = require("./corporateBookCustomerRoutes");
const corporateHostListingRoutes = require("./corporateHostListingRoutes");
const bookingRoutes = require("./Booking");
const adminRoutes = require("./adminRoutes");
const userRoutes = require("./UserRoutes");

router.use("/api", corporateHostRoutes);
router.use("/api", corporateBookRoutes);
router.use("/api/cb", corporateHostCustomerRoutes);
router.use("/api/book", corporateBookCustomerRoutes);
router.use("/api", corporateHostListingRoutes);
router.use("/api", bookingRoutes);
router.use("/api", adminRoutes);
router.use("/api", userRoutes);
// Compatibility mounts for clients that call legacy root paths like /books or /hosts.
router.use(corporateHostRoutes);
router.use(corporateBookRoutes);
router.use(corporateHostCustomerRoutes);
router.use(corporateBookCustomerRoutes);
router.use(corporateHostListingRoutes);
router.use(bookingRoutes);
router.use(adminRoutes);
router.use(userRoutes);

module.exports = router;
