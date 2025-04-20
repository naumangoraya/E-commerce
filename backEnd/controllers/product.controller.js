import Products from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Products.find({});
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.messgae });
  }
};
