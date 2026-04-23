export const normalizeRole = (role) => {
  const value = typeof role === "string" ? role.toLowerCase() : "";

  if (value === "farmer") return "seller";
  if (value === "buyer") return "customer";
  if (value === "seller" || value === "customer") return value;

  return "";
};

export const isSellerRole = (role) => normalizeRole(role) === "seller";

export const isCustomerAccessForbiddenError = (error) => {
  const message = String(error?.message || error || "");

  return (
    message.includes("customer accounts cannot access this resource") ||
    (message.includes("403") && message.includes("Forbidden"))
  );
};
