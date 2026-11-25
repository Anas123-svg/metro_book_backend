const express = require("express");
const router = express.Router();
const controller = require("../controllers/BookingController");

// -------------------- BOOKINGS --------------------

router.post("/bookings", controller.createBooking);
router.get("/bookings", controller.getAllBookings);
router.get("/bookings/:id", controller.getBookingById);
router.put("/bookings/:id", controller.updateBooking);
router.delete("/bookings/:id", controller.deleteBooking);

router.get("/books/:bookId/bookings", controller.getBookingsByCorporateBook);
router.get("/hosts/:hostId/bookings", controller.getBookingsByCorporateHost);
router.get("/customers/:customerId/bookings", controller.getBookingsByCustomer);

module.exports = router;
