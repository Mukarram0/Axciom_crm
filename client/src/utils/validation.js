/**
 * Client-Side Validation Utilities
 */

export const validateEmail = (email) => {
  const re = /^\S+@\S+\.\S+$/;
  return re.test(String(email).toLowerCase());
};

export const validateIndianPhone = (phone) => {
  const re = /^[6-9]\d{9}$/;
  return re.test(String(phone).trim());
};

export const validatePasswordPolicy = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[@$!%*?&#]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (@$!%*?&#).' };
  }
  return { valid: true };
};
