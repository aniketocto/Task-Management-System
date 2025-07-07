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
    hasUppercase &&
    hasLowercase &&
    hasDigit /* && hasSpecialChar */ &&
    isLongEnough
  );
};
export const getGreeting = () => {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening";
  } else {
    return "Good Night";
  }
};

export const addThousandsSeperator = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
