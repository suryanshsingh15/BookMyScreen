const express = require("express");
const { createShow, getShows, getShowById, deleteShow } = require("../controllers/showController");
const { protect, admin } = require("../middleware/auth");

const router = express.Router();

router.get("/", getShows);
router.get("/:id", getShowById);
router.post("/", protect, admin, createShow);
router.delete("/:id", protect, admin, deleteShow);

module.exports = router;
