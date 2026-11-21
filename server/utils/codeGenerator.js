/**
 * Helper to generate human-readable, unique identifiers for CRM entities.
 * E.g., CUST-1001, LEAD-1001
 */

const Customer = require('../models/Customer');
const Lead = require('../models/Lead');

const generateCustomerCode = async () => {
  const count = await Customer.countDocuments();
  const nextNumber = 1000 + count + 1;
  return `CUST-${nextNumber}`;
};

const generateLeadCode = async () => {
  const count = await Lead.countDocuments();
  const nextNumber = 1000 + count + 1;
  return `LEAD-${nextNumber}`;
};

module.exports = {
  generateCustomerCode,
  generateLeadCode,
};
