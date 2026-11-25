const express = require("express");
const router = express.Router();
const controller = require("../controllers/AdminController");
const { authenticateAdmin } = require("../middleware/authMiddleware");

// Create a new admin
router.post("/admins", controller.createAdmin);

// Login admin
router.post("/admins/login", controller.loginAdmin);

// Logout admin
router.post("/admins/logout", authenticateAdmin, controller.logoutAdmin);

// Get current admin profile from token
router.get("/admins/me", authenticateAdmin, controller.getAdminProfile);

// Get all admins
router.get("/admins", controller.getAllAdmins);

// Get corporate booking account admin analytics
router.get("/admins/cpbook", authenticateAdmin, controller.getCorporateBookingAccountAdmin);

// Get corporate hosting account admin analytics
router.get("/admins/cphost", authenticateAdmin, controller.getCorporateHostingAccountAdmin);

// Get single admin by ID
router.get("/admins/:id", controller.getAdminById);

// Update admin
router.put("/admins/:id", controller.updateAdmin);

// Delete admin
router.delete("/admins/:id", controller.deleteAdmin);

module.exports = router;
