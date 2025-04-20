import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(400).json({ message: "Faild to fetch access Token" });
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.accessTokenSecret);

      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found!" });
      }

      req.user = user;

      next();
    } catch (error) {
      if (error.name == TokenExpiredError) {
        return res.status(401).json({ message: "Token Expired -Acces denied" });
      }
    }
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid Access Token-Access Denied" });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role == "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access Denied-Admin Only" });
  }
};
