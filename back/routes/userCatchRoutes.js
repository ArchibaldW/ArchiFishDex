const express = require("express");
const userCatchCtrl = require("../controllers/userCatch.js");
const { authenticateToken } = require('../middleware/authenticateToken');

const router = express.Router();

router.get("/", authenticateToken, userCatchCtrl.getCatches);
router.get("/last", authenticateToken, userCatchCtrl.getLastCatches);

module.exports = router;