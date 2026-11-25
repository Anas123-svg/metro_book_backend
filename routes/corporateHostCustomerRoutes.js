const express = require("express");
const router = express.Router();
const controller = require("../controllers/corporateHostCustomerController");
const { authenticateCorporateHost } = require("../middleware/authMiddleware");

// -------------------- CORPORATE HOST CUSTOMERS --------------------

// Create a new customer for a host
router.post("/customers", controller.createCustomerAccount);

// Send customer verification code
router.post("/customers/send-verification-code", controller.sendCustomerVerificationCode);

// Verify customer email
router.post("/customers/verify-email", controller.verifyCustomerEmail);

// Login customer
router.post("/customers/login", controller.loginCustomer);

// Get current customer profile
router.get("/customers/me", authenticateCorporateHost, controller.getCustomerProfile);

// Get all customers
router.get("/customers", controller.getAllCustomers);

// Get all customers under a host
router.get("/hosts/:hostId/customers", controller.getCustomersByHost);

// Get one customer by id
router.get("/customers/:id", controller.getCustomerById);

// Update customer
router.put("/customers/:id", controller.updateCustomer);

// Delete customer
router.delete("/customers/:id", controller.deleteCustomer);

module.exports = router;
