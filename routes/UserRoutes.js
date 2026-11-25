const express = require("express");
const router = express.Router();
const controller = require("../controllers/UserController");
const { authenticateUser } = require("../middleware/authMiddleware");

// Signup / create user
router.post("/users", controller.createUser);

// Login user
router.post("/users/login", controller.loginUser);

// Logout user (protected, requires valid token)
router.post("/users/logout", authenticateUser, controller.logoutUser);

// Get current user profile from token
router.get("/users/me", authenticateUser, controller.getUserProfile);

module.exports = router;

