const express = require("express");
const router = express.Router();
const { health, helloWorld } = require("../controllers/testController");

router.get("/health", health);
router.get(["/test", "/health/db", "/hello"], helloWorld);
module.exports = router;
