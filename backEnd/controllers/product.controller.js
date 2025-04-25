import Products from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";
import redis from "../lib/redis.js";
import { updateFeaturedProductsCache } from "../lib/redis.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Products.find({});
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.messgae });
  }
};
export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (!featuredProducts) {
      return res.status(404).json({ message: "No featured products found" });
    }
    featuredProducts = await Products.find({ isFeatured: true }).lean();
    if (!featuredProducts) {
      return res.status(404).json({ message: "No featured products found" });
    }
    await redis.set("featured_products", JSON.stringify(featuredProducts));
    res.json({ featuredProducts });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.messgae });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, price, description, image, category } = req.body;
    let cloudinaryResponse = null;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    const product = new Products.create({
      name,
      price,
      description,
      image: cloudinaryResponse?.secure_url
        ? cloudinaryResponse.secure_url
        : "",
      category,
    });
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};
export const deleteProduct = async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("Image deleted from cloudinary");
      } catch (error) {
        console.log(error);
      }
    }
    await Products.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};
export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Products.aggregate([
      {
        $sample: { size: 3 }, // Randomly select 3  products
      },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          description: 1,
          image: 1,
          category: 1,
        },
      },
    ]);
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};
export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Products.find({ category });
    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found in this category" });
    }
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);
    if (product) {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      await updateFeaturedProductsCache();
      res.json({
        updatedProduct,
      });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};
async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Products.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.error("Error updating featured products cache:", error);
  }
}
