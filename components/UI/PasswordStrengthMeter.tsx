import { FC, useMemo } from "react";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

interface PasswordProps {
  password: string;
}

interface Criteria {
  label: string;
  met: boolean;
}

const PasswordCriteria: FC<PasswordProps> = ({ password }) => {
  const criteria: Criteria[] = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="mt-3 space-y-2">
      {criteria.map((item) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center text-xs"
        >
          {item.met ? (
            <Check className="w-4 h-4 text-green-500 mr-2" />
          ) : (
            <X className="w-4 h-4 text-gray-500 mr-2" />
          )}

          <span
            className={`transition-colors ${
              item.met ? "text-green-500" : "text-gray-400"
            }`}
          >
            {item.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

const PasswordStrengthMeter: FC<PasswordProps> = ({ password }) => {
  const strength = useMemo(() => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    return score;
  }, [password]);

  const strengthConfig = [
    { label: "Very Weak", color: "bg-red-500" },
    { label: "Weak", color: "bg-red-400" },
    { label: "Fair", color: "bg-yellow-500" },
    { label: "Good", color: "bg-yellow-400" },
    { label: "Strong", color: "bg-green-500" },
  ];

  const current = strengthConfig[strength];

  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400">Password strength</span>
        <span className="text-xs text-gray-400">{current.label}</span>
      </div>

      {/* Animated Strength Bar */}
      <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${current.color}`}
          initial={{ width: 0 }}
          animate={{ width: `${(strength / 4) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <PasswordCriteria password={password} />
    </div>
  );
};

export default PasswordStrengthMeter;