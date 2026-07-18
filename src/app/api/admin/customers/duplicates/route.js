import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import Customer from "@/models/customer.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

// Pure JS Levenshtein Distance Algorithm
const getLevenshteinDistance = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const isSameLocation = (c1, c2) => {
  const city1 = c1.city?.trim().toLowerCase();
  const city2 = c2.city?.trim().toLowerCase();
  const pin1 = c1.pincode?.trim();
  const pin2 = c2.pincode?.trim();

  // Ensure fields are not blank before comparing
  const sameCity = city1 && city2 && city1 === city2;
  const samePin = pin1 && pin2 && pin1 === pin2;

  return sameCity || samePin;
};

const isSimilarName = (nameA, nameB) => {
  const n1 = nameA.trim().toLowerCase().replace(/\s+/g, " ");
  const n2 = nameB.trim().toLowerCase().replace(/\s+/g, " ");
  if (!n1 || !n2) return false;

  const distance = getLevenshteinDistance(n1, n2);
  // Same threshold as useFuzzySearch spelling suggestion
  return distance <= 3;
};

export const GET = asyncHandler(async (request) => {
  await dbConnect();

  // Secure authorization
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to view duplicate groups.");
  }

  const customers = await Customer.find({}).lean();
  const visited = new Set();
  const duplicateGroups = [];

  for (let i = 0; i < customers.length; i++) {
    const c1 = customers[i];
    const c1Id = c1._id.toString();
    if (visited.has(c1Id)) continue;

    const currentGroup = [c1];

    for (let j = i + 1; j < customers.length; j++) {
      const c2 = customers[j];
      const c2Id = c2._id.toString();
      if (visited.has(c2Id)) continue;

      if (isSameLocation(c1, c2) && isSimilarName(c1.name, c2.name)) {
        currentGroup.push(c2);
        visited.add(c2Id);
      }
    }

    if (currentGroup.length > 1) {
      visited.add(c1Id);

      // Sort by orderCount descending, with totalSpent as tie-breaker
      currentGroup.sort((a, b) => {
        if (b.orderCount !== a.orderCount) {
          return b.orderCount - a.orderCount;
        }
        return b.totalSpent - a.totalSpent;
      });

      duplicateGroups.push({
        primary: currentGroup[0],
        candidates: currentGroup.slice(1),
      });
    }
  }

  return NextResponse.json(
    new ApiResponse(200, duplicateGroups, "Duplicate customers scanned and grouped successfully.")
  );
});
