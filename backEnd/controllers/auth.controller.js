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
    samSite: "strict",
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
    await storeRefreshToke(user._id, refreshToken);
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
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  try {
    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToke(user._id, refreshToken);
      setcookies(res, accessToken, refreshToken);

      res.status(201).json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        message: "User logged in successfully",
      });
    } else {
      res.status(400).json({ message: "Invalid Credentials" });
    }
  } catch (error) {
    console.error("Error in logging in:", error);
    res.status(501).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.refreshTokenSecret);
      console.log(decoded.userId);
      await redis.del(`refreshtoken:${decoded.userId}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({
      message: "You are logged out",
    });
  } catch (error) {
    res.status(500).json({ message: "server Error", Error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refrsh token Provided" });
    }
    const decoded = jwt.verify(refreshToken, process.env.refreshTokenSecret);
    const storedToken = await redis.get(`refreshtoken:${decoded.userId}`);
    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "invalid refresh token" });
    }
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.accessTokenSecret,
      { expiresIn: "15m" }
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV == "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Token refreshed Successfully" });
  } catch (error) {
    res.status(500).json({ message: "ServerError", error: error.message });
  }
};
