import { FC } from "react";
import { motion } from "framer-motion";

const LoadingSpinner: FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent relative overflow-hidden">
      
      {/* Outer rotating ring */}
      <motion.div
        className="w-16 h-16 rounded-full border-4 border-green-200 border-t-green-500"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Inner pulse glow */}
      <motion.div
        className="absolute w-6 h-6 bg-green-400 rounded-full blur-md"
        animate={{
          scale: [1, 1.6, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default LoadingSpinner;