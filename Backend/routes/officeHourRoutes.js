const express = require("express");
const {
  bookOfficeHourSlot,
  createOfficeHourSlot,
  getMyOfficeHourBookings,
  getOfficeHourSlots,
  getProfessorOfficeHourBookings,
  updateOfficeHourBookingStatus,
  updateOfficeHourSlot,
} = require("../controllers/officeHourController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/slots", createOfficeHourSlot);
router.get("/slots", getOfficeHourSlots);
router.get("/courses/:courseId/slots", getOfficeHourSlots);
router.patch("/slots/:slotId", updateOfficeHourSlot);
router.post("/slots/:slotId/book", bookOfficeHourSlot);
router.get("/bookings/mine", getMyOfficeHourBookings);
router.get("/bookings/professor", getProfessorOfficeHourBookings);
router.patch("/bookings/:bookingId/status", updateOfficeHourBookingStatus);

module.exports = router;