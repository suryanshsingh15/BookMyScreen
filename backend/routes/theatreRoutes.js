const express = require("express");
const {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
} = require("../controllers/theatreController");
const { protect, admin } = require("../middleware/auth");

const router = express.Router();

router.get("/", getTheatres);
router.get("/:id", getTheatreById);
router.post("/", protect, admin, createTheatre);
router.put("/:id", protect, admin, updateTheatre);
router.delete("/:id", protect, admin, deleteTheatre);

module.exports = router;
