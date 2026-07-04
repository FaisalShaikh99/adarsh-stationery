import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Brand/Manufacturer name is required"],
      trim: true,
      unique: true 
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category" 
      }
    ],
    primaryContact: {
      type: String,
      trim: true,
      default: "" 
    },
    websiteURL: {
      type: String,
      trim: true,
      default: "" 
    },
    logo: {
      type: String,
      default: "" ,
      required: [true, "Brand/Manufacturer logo is required"],
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true 
    }
  },
  { 
    timestamps: true
  }
);

export const Brand = mongoose.models.Brand || mongoose.model("Brand", brandSchema);