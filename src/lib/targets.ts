// Daffy's capital-to-target rules
export const getTarget = (startingBalance: number): { min: number; max: number } => {
  if (startingBalance >= 1000) return { min: startingBalance * 10, max: startingBalance * 10 };
  if (startingBalance >= 100) return { min: startingBalance * 10, max: startingBalance * 10 };
  if (startingBalance >= 50) return { min: startingBalance * 8, max: startingBalance * 8 };
  if (startingBalance >= 15) return { min: Math.round(startingBalance * 6.67), max: Math.round(startingBalance * 13.33) };
  return { min: startingBalance * 5, max: startingBalance * 10 };
};

export const formatTarget = (target: { min: number; max: number }): string => {
  if (target.min === target.max) return `$${target.min.toLocaleString("en-US")}`;
  return `$${target.min.toLocaleString("en-US")} - $${target.max.toLocaleString("en-US")}`;
};
