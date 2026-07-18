import Product from "@/models/product.model";

export const orderPopulation = [
  { path: "customer", select: "name email" },
  { path: "items.product" },
];
