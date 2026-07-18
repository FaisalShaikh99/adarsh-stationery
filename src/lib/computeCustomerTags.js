/**
 * Calculates customer tags based on order history metrics.
 * 
 * Rules:
 * - "VIP": orderCount >= 5
 * - "New": firstOrderDate is within the last 30 days
 * - "At Risk": lastOrderDate is more than 60 days ago AND orderCount >= 1
 * 
 * @param {Object} customer - The customer object containing orderCount, totalSpent, firstOrderDate, lastOrderDate.
 * @returns {Array<string>} - The array of computed tags.
 */
export function computeCustomerTags(customer) {
  const tags = [];
  const now = new Date();

  // VIP Rule
  if (customer.orderCount >= 5) {
    tags.push("VIP");
  }

  // New Rule: firstOrderDate within last 30 days
  if (customer.firstOrderDate) {
    const timeDiff = now.getTime() - new Date(customer.firstOrderDate).getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    if (daysDiff <= 30) {
      tags.push("New");
    }
  }

  // At Risk Rule: lastOrderDate > 60 days ago AND orderCount >= 1
  if (customer.lastOrderDate && customer.orderCount >= 1) {
    const timeDiff = now.getTime() - new Date(customer.lastOrderDate).getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    if (daysDiff > 60) {
      tags.push("At Risk");
    }
  }

  return tags;
}
