import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product must belong to a category"]
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Product must be linked to a company/brand"]
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0
    },
    stockUnit: {
      type: String,
      required: [true, "Stock unit is required"],
      default: "Pcs"
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: [0, "Cost price cannot be negative"]
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"]
    },
    images: {
      type: [String],
      required: [true, "At least one product image is required"],
      validate: {
        validator: function (array) {
          return array && array.length > 0;
        },
        message: "Product must have at least 1 image"
      }
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isVisible: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true 
  }
);

// Force fresh schema registration on reload to avoid schema cache conflicts in Next.js dev server
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

export default mongoose.model("Product", ProductSchema);