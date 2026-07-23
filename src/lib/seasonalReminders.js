export const seasonalRules = [
  {
    monthsActive: [2, 3, 4, 5, 6], // Feb - Jun
    title: "School Reopening Season",
    message: "School reopening season is approaching! Consider stocking up on notebooks, pens, geometry boxes, and school bags.",
  },
  {
    monthsActive: [7, 8], // Jul - Aug
    title: "Mid-Term Academic Rush",
    message: "Mid-term examinations approaching. Stock up on exam pads, register notebooks, and writing accessories.",
  },
  {
    monthsActive: [10, 11], // Oct - Nov
    title: "Festive & Corporate Gifting Season",
    message: "Festival season is here! Consider promoting executive diaries, gift-wrapping, calligraphic pen sets, and premium stationery.",
  },
  {
    monthsActive: [12, 1], // Dec - Jan
    title: "New Year & Corporate Planning",
    message: "New Year planning season! Stock up on year planners, desk calendars, executive notebooks, and office registers.",
  },
];

export function getCurrentSeasonalReminder(date = new Date()) {
  const currentMonth = date.getMonth() + 1; // 1-indexed: 1 = Jan, 12 = Dec
  const activeRule = seasonalRules.find((rule) => rule.monthsActive.includes(currentMonth));
  if (!activeRule) return null;
  return {
    title: activeRule.title,
    message: activeRule.message,
    month: currentMonth,
  };
}
