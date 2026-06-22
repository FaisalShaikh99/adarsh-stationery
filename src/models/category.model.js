import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    image: {
      type: String, 
      default: "https://res.cloudinary.com/dfyhsuoc4/image/upload/v1782111857/image-icon-vector-image-can-be-used-ui_120816-260360_e4nble.jpg",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalProducts: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

export const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);