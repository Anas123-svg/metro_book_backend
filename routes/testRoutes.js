const express = require("express");
const router = express.Router();

const { helloWorld } = require("../controllers/testController");

router.get("/hello", helloWorld);

module.exports = router;