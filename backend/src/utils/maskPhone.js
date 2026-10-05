// Utility to mask a phone number for privacy: show first 2 and last 2 digits only
// Example: "9876543210" -> "98******10"
const maskPhone = (phone) => {
  if (!phone || phone.length < 4) return phone;
  // Keep first 2 chars, mask the middle, keep last 2 chars
  const start = phone.slice(0, 2);
  const end = phone.slice(-2);
  const stars = '*'.repeat(phone.length - 4);
  return `${start}${stars}${end}`;
};

module.exports = { maskPhone };
