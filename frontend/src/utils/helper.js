export const validateEmail = (email) => {
  // Check if email is a string, and ends correctly
  const regex = /^[^\s@]+@getunstoppable\.in$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  // const hasSpecialChar = /[!@#$%^&*()_\-+=<>?{}[\]~]/.test(password);
  const isLongEnough = password.length >= 6;

  return (
    hasUppercase && hasLowercase && hasDigit /* && hasSpecialChar */ && isLongEnough
  );
};
