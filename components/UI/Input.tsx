import React, { FC, InputHTMLAttributes } from "react";
import { LucideIcon } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconClick?: () => void;
}

const Input: FC<InputProps> = ({
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  className = "",
  ...props
}) => {
  return (
    <div className="relative mb-6">
      {Icon && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Icon className="w-5 h-5 text-green-500" />
        </div>
      )}

      <input
        {...props}
        className={`w-full py-2 pl-10 pr-10 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400
        focus:border-green-500 focus:ring-2 focus:ring-green-500 transition ${className}`}
      />

      {RightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
        >
          <RightIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Input;