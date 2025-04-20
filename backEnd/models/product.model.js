import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    isfeatured: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
const Products = mongoose.model("Products", ProductSchema);
export default Products;
