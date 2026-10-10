const express = require("express");
const userCtrl = require("../controllers/user.js");
const { authenticateToken } = require('../middleware/authenticateToken');

const router = express.Router();

router.get("/pokedex/users", authenticateToken, userCtrl.getPokedexUsers);
router.get("/pokedex", authenticateToken, userCtrl.getUserPokedex);
router.get("/profile/:username", authenticateToken, userCtrl.getUserProfile);
router.patch("/profile", authenticateToken, userCtrl.updateUserProfile);
router.get('/statistics', authenticateToken, userCtrl.getUserStatistics)
router.get("/achievements", authenticateToken, userCtrl.getUserAchievements)

router.get("/leaderboards", userCtrl.getLeaderboards);

router.post("/catch", authenticateToken, userCtrl.addUserCatch)

module.exports = router;