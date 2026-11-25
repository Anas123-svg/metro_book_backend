const express = require("express");
const router = express.Router();
const controller = require("../controllers/corporateHostListingsController");
const { authenticateCorporateHost } = require("../middleware/authMiddleware");

// -------------------- CORPORATE HOST LISTINGS --------------------

// Create listing
router.post("/listings", authenticateCorporateHost, controller.createListing);

// Get all listings (supports query filters)
router.get("/listings", controller.getAllListings);

// Advanced listing filters (clients/owner/prices/property types)
router.get("/listings/filter", controller.filterListings);

// Get only active, not-booked, currently date-available listings
router.get("/listings/available", controller.getAvailableListings);

// Get listing by id
router.get("/listings/:id", controller.getListingById);

// Get listings for a host
router.get("/hosts/:hostId/listings", controller.getListingsByHost);

// Get listings for a customer
router.get("/customers/:customerId/listings", controller.getListingsByCustomer);

// Update listing
router.put("/listings/:id", authenticateCorporateHost, controller.updateListing);

// Delete listing
router.delete("/listings/:id", authenticateCorporateHost, controller.deleteListing);

module.exports = router;
