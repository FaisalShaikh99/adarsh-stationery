import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      unique: true, // Poore database me double nahi ho sakti 🛡️
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product must belong to a category"],
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    companyLogo: {
      type: String,
      required: [true, "Company logo asset path is required"],
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    stockUnit: {
      type: String,
      required: [true, "Stock unit is required"],
      default: "Pcs",
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: [0, "Cost price cannot be negative"],
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔥 AUTO GENERATION LOGIC: Save hone se theek pehle ID khud banegi!
ProductSchema.pre("save", function (next) {
  if (!this.productId) {
    // Company ke shuruat ke 2 akshar nikale (e.g., Classmate -> CL)
    const prefix = this.company.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, "ST");
    // 4 digit ka random unique number lagaya
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    
    this.productId = `${prefix}-${randomNumber}`; // Output: CL-4829
  }
  next();
});

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export default Product;