const express = require("express");
const router = express.Router();
const controller = require("../controllers/corporateBookController");
const teamAccountController = require("../controllers/corporateBookTeamAccountController");
const { authenticateCorporateHost } = require("../middleware/authMiddleware");

// -------------------- CORPORATE BOOK ACCOUNT --------------------

// Create a new corporate book
router.post("/books", controller.createCorporateBook);

// Send email verification code to book admin email
router.post("/books/send-verification-code", controller.sendCorporateBookVerificationCode);

// Verify book email with code
router.post("/books/verify-email", controller.verifyCorporateBookEmail);

// Login corporate book
router.post("/books/login", controller.loginCorporateBook);

// Get current corporate book profile from token
router.get("/books/me", authenticateCorporateHost, controller.getCorporateBookProfile);

// Get all corporate books
router.get("/books", controller.getAllCorporateBooks);

// Get a single corporate book by ID
router.get("/books/:id", controller.getCorporateBookById);

// Update a corporate book
router.put("/books/:id", controller.updateCorporateBook);

// Delete a corporate book
router.delete("/books/:id", controller.deleteCorporateBook);

// -------------------- PAYMENT METHODS --------------------

// Add a payment method
router.post("/book-payment-methods", controller.addPaymentMethod);

// Get all payment methods of a book
router.get("/books/:id/payment-methods", controller.getPaymentMethods);

// Update a payment method
router.put("/book-payment-methods/:id", controller.updatePaymentMethod);

// Delete a payment method
router.delete("/book-payment-methods/:id", controller.deletePaymentMethod);

// -------------------- TEAM ACCOUNTS --------------------

// Create a team account under a book
router.post("/books/:bookId/team-accounts", teamAccountController.createTeamAccount);

// List team accounts under a book
router.get("/books/:bookId/team-accounts", teamAccountController.getTeamAccountsByBook);

// Index team accounts across books (supports filters)
router.get("/book-team-accounts", teamAccountController.indexTeamAccounts);

// Get a team account by ID
router.get("/book-team-accounts/:id", teamAccountController.getTeamAccountById);

// Update a team account
router.put("/book-team-accounts/:id", teamAccountController.updateTeamAccount);

// Delete a team account
router.delete("/book-team-accounts/:id", teamAccountController.deleteTeamAccount);

module.exports = router;
