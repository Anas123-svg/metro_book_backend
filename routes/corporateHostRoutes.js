const express = require("express");
const router = express.Router();
const controller = require("../controllers/corporateHostController");
const teamAccountController = require("../controllers/corporateHostTeamAccountController");
const { authenticateCorporateHost } = require("../middleware/authMiddleware");

// -------------------- CORPORATE HOST ACCOUNT --------------------

// Create a new corporate host
router.post("/hosts", controller.createCorporateHost);

// Send email verification code to host email
router.post("/hosts/send-verification-code", controller.sendCorporateHostVerificationCode);

// Verify host email with code
router.post("/hosts/verify-email", controller.verifyCorporateHostEmail);

// Login corporate host
router.post("/hosts/login", controller.loginCorporateHost);

// Get current corporate host profile from token
router.get("/hosts/me", authenticateCorporateHost, controller.getCorporateHostProfile);

// Get all corporate hosts
router.get("/hosts", controller.getAllCorporateHosts);

// Get a single corporate host by ID
router.get("/hosts/:id", controller.getCorporateHostById);

// Update a corporate host
router.put("/hosts/:id", controller.updateCorporateHost);

// Delete a corporate host
router.delete("/hosts/:id", controller.deleteCorporateHost);

// -------------------- PAYMENT METHODS --------------------

// Add a payment method
router.post("/payment-methods", controller.addPaymentMethod);

// Get all payment methods of a host
router.get("/hosts/:id/payment-methods", controller.getPaymentMethods);

// Update a payment method
router.put("/payment-methods/:id", controller.updatePaymentMethod);

// Delete a payment method
router.delete("/payment-methods/:id", controller.deletePaymentMethod);

// -------------------- TEAM ACCOUNTS --------------------

// Create a team account under a host
router.post("/hosts/:hostId/team-accounts", teamAccountController.createTeamAccount);

// List team accounts under a host
router.get("/hosts/:hostId/team-accounts", teamAccountController.getTeamAccountsByHost);

// Index team accounts across hosts (supports filters)
router.get("/team-accounts", teamAccountController.indexTeamAccounts);

// Get a team account by ID
router.get("/team-accounts/:id", teamAccountController.getTeamAccountById);

// Update a team account
router.put("/team-accounts/:id", teamAccountController.updateTeamAccount);

// Delete a team account
router.delete("/team-accounts/:id", teamAccountController.deleteTeamAccount);

module.exports = router;
