const express = require("express");
const router = express.Router();
const controller = require("../controllers/corporateBookCustomerController");
const { authenticateCorporateHost } = require("../middleware/authMiddleware");

// -------------------- CORPORATE BOOK CUSTOMERS --------------------

// Create a new customer for a book
router.post("/book-customers", controller.createCustomerAccount);

// Send customer verification code
router.post("/book-customers/send-verification-code", controller.sendCustomerVerificationCode);

// Verify customer email
router.post("/book-customers/verify-email", controller.verifyCustomerEmail);

// Login customer
router.post("/book-customers/login", controller.loginCustomer);

// Get current customer profile
router.get("/book-customers/me", authenticateCorporateHost, controller.getCustomerProfile);

// Get all customers
router.get("/book-customers", controller.getAllCustomers);

// Get all customers under a book
router.get("/:bookId/book-customers", controller.getCustomersByBook);

// Get one customer by id
router.get("/book-customers/:id", controller.getCustomerById);

// Update customer
router.put("/book-customers/:id", controller.updateCustomer);

// Delete customer
router.delete("/book-customers/:id", controller.deleteCustomer);

module.exports = router;
