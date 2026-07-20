import Customer from "../models/customer.model.js";
import { computeCustomerTags } from "./computeCustomerTags.js";

/**
 * Finds an existing customer by phone number or creates a new one, updating their order history,
 * address fields to latest used, and recalculating tags.
 * 
 * @param {Object} shippingAddress - Order shipping address (name, phone, addressLine1, addressLine2, city, state, pincode).
 * @param {number} totalAmount - Total cost of this order.
 * @param {Date|string} [orderDate] - Timestamp when the order was placed.
 * @returns {Promise<Object>} - The matched/created Customer document.
 */
export async function matchOrCreateCustomer(shippingAddress, totalAmount, orderDate = new Date()) {
  const { name, email, phone, addressLine1, addressLine2, city, state, pincode } = shippingAddress;
  const oDate = new Date(orderDate);
  const trimmedPhone = phone.trim();

  let customer = await Customer.findOne({ phone: trimmedPhone });

  if (customer) {
    // 1. Update stats
    customer.orderCount += 1;
    customer.totalSpent += totalAmount;

    // 2. Adjust chronological boundaries
    if (!customer.firstOrderDate || oDate < new Date(customer.firstOrderDate)) {
      customer.firstOrderDate = oDate;
    }
    if (!customer.lastOrderDate || oDate > new Date(customer.lastOrderDate)) {
      customer.lastOrderDate = oDate;
    }

    // 3. Update profile details to the latest address used
    customer.name = name.trim();
    customer.addressLine1 = addressLine1.trim();
    customer.addressLine2 = addressLine2 ? addressLine2.trim() : "";
    customer.city = city.trim();
    customer.state = state.trim();
    customer.pincode = pincode.trim();

    if (email && email.trim()) {
      customer.email = email.trim();
    }

    // 4. Compute tags
    customer.tags = computeCustomerTags(customer);

    await customer.save();
  } else {
    // Create new customer
    customer = new Customer({
      name: name.trim(),
      email: (email && email.trim()) ? email.trim() : "",
      phone: trimmedPhone,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : "",
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      orderCount: 1,
      totalSpent: totalAmount,
      firstOrderDate: oDate,
      lastOrderDate: oDate,
      status: "Active",
    });

    customer.tags = computeCustomerTags(customer);
    await customer.save();
  }

  return customer;
}
