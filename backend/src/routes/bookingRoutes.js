import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  cancelBooking,
  createBooking,
  getAllBookings,
  getBookingOverview,
  getBookingsByEmail,
  getWaitlistByEmail,
  joinWaitlist,
  rescheduleBooking,
  updateBookingStatus
} from "../controllers/bookingController.js";

const router = Router();

router.get("/", asyncHandler(getBookingsByEmail));
router.get("/manage/all", asyncHandler(getAllBookings));
router.get("/overview/stats", asyncHandler(getBookingOverview));
router.get("/waitlist", asyncHandler(getWaitlistByEmail));
router.post("/", asyncHandler(createBooking));
router.post("/waitlist", asyncHandler(joinWaitlist));
router.patch("/:id/status", asyncHandler(updateBookingStatus));
router.patch("/:id/cancel", asyncHandler(cancelBooking));
router.patch("/:id/reschedule", asyncHandler(rescheduleBooking));

export default router;
