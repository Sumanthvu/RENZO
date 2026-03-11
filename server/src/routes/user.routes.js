import { Router } from "express";
import {
  sendOtpForRegistration,
  verifyOtpAndRegister,
  loginUser,
  logOutUser,
  forgotPassword,
  resetPassword,
  googleLogin
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Adjust path if necessary

const router = Router();

// ==========================================
// PUBLIC ROUTES (No token required)
// ==========================================

// Step 1: User submits details -> Backend sends OTP
router.route("/register").post(sendOtpForRegistration);

// Step 2: User submits OTP -> Backend creates account
router.route("/verify-otp").post(verifyOtpAndRegister);

// User logs in -> Backend sends JWTs
router.route("/login").post(loginUser);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/google-login").post(googleLogin);


// ==========================================
// SECURED ROUTES (JWT Token required)
// ==========================================

// User logs out -> Backend clears cookies
// The verifyJWT middleware runs first. If it fails, logOutUser never runs!
router.route("/logout").post(verifyJWT, logOutUser);

export default router;