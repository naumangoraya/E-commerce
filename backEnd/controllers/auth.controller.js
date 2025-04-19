import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.accessTokenSecret, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.refreshTokenSecret, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

const storeRefreshToke = async (userId, refreshToken) => {
  await redis.set(
    `refreshtoken:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};

const setcookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV == "production",
    SamSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV == "production",
    SamSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  console.log("Signup request received for:", email);

  try {
    console.log("Checking if user exists with email:", email);
    const userExists = await User.findOne({ email });
    console.log("User exists check result:", userExists);

    if (userExists) {
      return res.status(400).json({ message: "user already exist" });
    }

    console.log("Creating new user with email:", email);
    const user = await User.create({ name, email, password });
    console.log("User created successfully:", user._id);

    //

    const { accessToken, refreshToken } = generateTokens(user._id);
    storeRefreshToke(user._id, refreshToken);
    setcookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(501).json({ message: error.message });
  }
};

export const signin = async (req, res) => {
  res.send("sign in route called");
};

export const logout = async (req, res) => {
  res.send("logout route called");
};
