import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Otp } from "../models/otp.model.js";
import { sendEmail } from "../utils/sendMail.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper Functions
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==========================================
// CONTROLLERS
// ==========================================

const sendOtpForRegistration = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if ([fullName, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // 1. Check if user already exists and is verified
  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.isVerified) {
    throw new ApiError(409, "User with this email already exists and is verified.");
  }

  // 2. If user exists but is NOT verified, we update their details (in case they made a typo)
  if (existingUser && !existingUser.isVerified) {
    existingUser.fullName = fullName;
    existingUser.password = password; // Will be hashed by pre-save hook
    await existingUser.save();
  } else {
    // 3. If totally new user, create them but keep isVerified: false
    await User.create({
      fullName,
      email,
      password,
      isVerified: false,
    });
  }

  // 4. Generate OTP and save to our temporary OTP database
  const otp = generateOtp();
  
  // Delete any old OTPs for this email before creating a new one
  await Otp.deleteMany({ email });
  await Otp.create({ email, otp });

  // 5. Send Email via Brevo
  const emailMsg = `
    <h2>Welcome to SparkShell!</h2>
    <p>Your verification code is: <strong style="font-size: 24px;">${otp}</strong></p>
    <p>This code will expire in 5 minutes.</p>
  `;
  
  const emailRes = await sendEmail(email, "Verify Your SparkShell Account", emailMsg);
  
  // WE ADDED THESE TWO LOGS TO FORCE THE TERMINAL TO SPEAK
  console.log("--- BREVO RAW RESPONSE ---");
  console.log(emailRes); 

  if (!emailRes.success) {
    throw new ApiError(500, "Failed to send OTP email");
  }

  return res.status(200).json(
    new ApiResponse(200, { email }, "OTP sent successfully to your email.")
  );
});


const verifyOtpAndRegister = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required.");
  }

  // 1. Find the OTP in the database
  const otpRecord = await Otp.findOne({ email, otp });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid OTP or OTP has expired.");
  }

  // 2. Mark user as verified
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { isVerified: true } },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found during verification.");
  }

  // 3. Delete the OTP so it can't be reused
  await Otp.deleteMany({ email });

  return res.status(201).json(
    new ApiResponse(201, user, "Account successfully verified and created!")
  );
});


const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required for login");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Check if they completed OTP verification!
  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        "User logged in successfully"
      )
    );
});


const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } }, // $unset completely removes the field
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export {
  sendOtpForRegistration,
  verifyOtpAndRegister,
  loginUser,
  logOutUser
};