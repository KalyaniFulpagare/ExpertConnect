import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
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

router.get("/", requireAuth, asyncHandler(getBookingsByEmail));
router.get("/manage/all", requireAuth, asyncHandler(getAllBookings));
router.get("/overview/stats", asyncHandler(getBookingOverview));
router.get("/waitlist", requireAuth, asyncHandler(getWaitlistByEmail));
router.post("/", requireAuth, asyncHandler(createBooking));
router.post("/waitlist", requireAuth, asyncHandler(joinWaitlist));
router.patch("/:id/status", requireAuth, asyncHandler(updateBookingStatus));
router.patch("/:id/cancel", requireAuth, asyncHandler(cancelBooking));
router.patch("/:id/reschedule", requireAuth, asyncHandler(rescheduleBooking));

export default router;
