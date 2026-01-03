export interface PasswordStrength {
  score: number; // 0-4
  level: "very-weak" | "weak" | "medium" | "good" | "strong";
  label: string;
  color: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
  };
  meetsMinimum: boolean;
}

export const validatePassword = (password: string): PasswordStrength => {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  // Calculate score based on checks
  const checksPassed = Object.values(checks).filter(Boolean).length;
  let score = 0;

  if (password.length === 0) {
    score = 0;
  } else if (checksPassed === 1) {
    score = 1;
  } else if (checksPassed === 2) {
    score = 2;
  } else if (checksPassed === 3) {
    score = 3;
  } else if (checksPassed >= 4) {
    score = 4;
  }

  // Determine level, label, and color
  let level: PasswordStrength["level"];
  let label: string;
  let color: string;

  switch (score) {
    case 0:
      level = "very-weak";
      label = "Very Weak";
      color = "#ef4444"; // red-500
      break;
    case 1:
      level = "weak";
      label = "Weak";
      color = "#f97316"; // orange-500
      break;
    case 2:
      level = "medium";
      label = "Medium";
      color = "#eab308"; // yellow-500
      break;
    case 3:
      level = "good";
      label = "Good";
      color = "#22c55e"; // green-500
      break;
    case 4:
      level = "strong";
      label = "Strong";
      color = "#10b981"; // emerald-500
      break;
    default:
      level = "very-weak";
      label = "Very Weak";
      color = "#ef4444";
  }

  // Password meets minimum requirements (at least 3 checks including min length)
  const meetsMinimum = checks.minLength && checksPassed >= 3;

  return {
    score,
    level,
    label,
    color,
    checks,
    meetsMinimum,
  };
};

export const getPasswordRequirements = () => [
  "Minst 8 tecken",
  "En versal bokstav",
  "En gemen bokstav",
  "En siffra",
];
