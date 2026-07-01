import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    productId: { type: String, unique: true },
    name: { type: String, required: [true, "Product name is required"], trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: [true, "Product must belong to a category"] },
    company: { type: String, trim: true, default: "Generic" }, // 🔥 Optional ho gaya
    companyLogo: { type: String, default: "" }, // 🔥 Optional ho gaya
    stock: { type: Number, required: [true, "Stock quantity is required"], min: 0, default: 0 },
    stockUnit: { type: String, required: [true, "Stock unit is required"], default: "Pcs" },
    costPrice: { type: Number, required: [true, "Cost price is required"], min: 0 },
    sellingPrice: { type: Number, required: [true, "Selling price is required"], min: 0 },
    images: { 
      type: [String], 
      required: [true, "At least one product image is required"],
      validate: [array => array.length > 0, "Product must have at least 1 image"] // 🔥 Sirf 1 required!
    },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.pre("save", function () {
  if (!this.productId) {
    const prefix = this.company && this.company !== "Generic" 
      ? this.company.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, "ST")
      : "ST";
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    this.productId = `${prefix}-${randomNumber}`;
  }
});

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);