import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createBooking,
  getAllBookings,
  getBookingOverview,
  getBookingsByEmail,
  updateBookingStatus
} from "../controllers/bookingController.js";

const router = Router();

router.get("/", asyncHandler(getBookingsByEmail));
router.get("/manage/all", asyncHandler(getAllBookings));
router.get("/overview/stats", asyncHandler(getBookingOverview));
router.post("/", asyncHandler(createBooking));
router.patch("/:id/status", asyncHandler(updateBookingStatus));

export default router;
