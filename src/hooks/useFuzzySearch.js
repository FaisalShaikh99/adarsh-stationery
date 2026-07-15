"use client";

import { useMemo } from "react";
import Fuse from "fuse.js";

// Pure JS Levenshtein Distance Algorithm (spelling checker)
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


export default function useFuzzySearch(items = [], searchQuery = "", keys = ["name"]) {
  // Normalize search keys to array format
  const searchKeys = useMemo(() => (Array.isArray(keys) ? keys : [keys]), [keys]);

  const { results, suggestion } = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) {
      return { results: items, suggestion: null };
    }

    const lowerQuery = query.toLowerCase();

    // 1. Direct match: check case-insensitive exact substring matches
    const exactMatches = items.filter((item) => {
      return searchKeys.some((key) => {
        const val = typeof item === "string" ? item : item[key];
        return val && String(val).toLowerCase().includes(lowerQuery);
      });
    });

    if (exactMatches.length > 0) {
      return { results: exactMatches, suggestion: null };
    }

    // 2. Fuse.js Fuzzy Search Setup
    const fuseOptions = {
      keys: searchKeys,
      threshold: 0.5,
      ignoreLocation: true,
      minMatchCharLength: 3,
      includeScore: true,
    };

    const fuse = new Fuse(items, fuseOptions);
    const fuseResults = fuse.search(query);

    if (fuseResults.length > 0) {
      // Find the best match (lowest score is best)
      const bestMatch = fuseResults[0];
      const matchItem = bestMatch.item;
      const displayVal = typeof matchItem === "string" ? matchItem : matchItem[searchKeys[0]];
      return { results: [], suggestion: displayVal };
    }

    // 3. Hand-written Levenshtein-distance fallback (if Fuse.js returns nothing)
    let bestMatchItemName = null;
    let minDistance = 999;

    items.forEach((item) => {
      searchKeys.forEach((key) => {
        const val = typeof item === "string" ? item : item[key];
        if (!val) return;

        const valStr = String(val).toLowerCase();
        const words = valStr.split(/\s+/);
        let closestWordDistance = 999;

        // Check distance to individual words
        words.forEach((word) => {
          const wordDist = getLevenshteinDistance(lowerQuery, word);
          if (wordDist < closestWordDistance) closestWordDistance = wordDist;
        });

        // Check distance to global field string value
        const globalDistance = getLevenshteinDistance(lowerQuery, valStr);
        const finalDistance = Math.min(closestWordDistance, globalDistance);

        // Distance threshold: <= 3 for queries under 12 characters
        const maxThreshold = lowerQuery.length < 12 ? 3 : Math.floor(lowerQuery.length / 4);

        if (finalDistance < minDistance && finalDistance <= maxThreshold) {
          minDistance = finalDistance;
          bestMatchItemName = typeof item === "string" ? item : item[searchKeys[0]];
        }
      });
    });

    return { results: [], suggestion: bestMatchItemName };
  }, [items, searchQuery, searchKeys]);

  return { results, suggestion };
}
