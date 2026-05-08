import { Router } from "express";
import { login, signup, getCurrentUser, updateCurrentUser } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/signup", asyncHandler(signup));
router.post("/login", asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(getCurrentUser));
router.patch("/me", requireAuth, asyncHandler(updateCurrentUser));

export default router;
