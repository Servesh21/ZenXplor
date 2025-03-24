
import React from "react";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface AuthButtonsProps {
  className?: string;
  variant?: "default" | "outline" | "minimal";
  showIcons?: boolean;
  showLabels?: boolean;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ 
  className,
  variant = "default",
  showIcons = true,
  showLabels = true
}) => {
  const getButtons = () => {
    switch (variant) {
      case "outline":
        return (
          <>
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/login">
                {showIcons && <LogIn className="mr-2 h-4 w-4" />}
                {showLabels && "Login"}
              </Link>
            </Button>
            <Button className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all duration-300" asChild>
              <Link to="/signup">
                {showIcons && <UserPlus className="mr-2 h-4 w-4" />}
                {showLabels && "Sign Up"}
              </Link>
            </Button>
          </>
        );
      case "minimal":
        return (
          <>
            <Button variant="ghost" className="rounded-full" asChild>
              <Link to="/login">
                {showIcons && <LogIn className="mr-2 h-4 w-4" />}
                {showLabels && "Login"}
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/signup">
                {showIcons && <UserPlus className="mr-2 h-4 w-4" />}
                {showLabels && "Sign Up"}
              </Link>
            </Button>
          </>
        );
      default:
        return (
          <>
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/login">
                {showIcons && <LogIn className="mr-2 h-4 w-4" />}
                {showLabels && "Login"}
              </Link>
            </Button>
            <Button className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all duration-300" asChild>
              <Link to="/signup">
                {showIcons && <UserPlus className="mr-2 h-4 w-4" />}
                {showLabels && "Sign Up Free"}
              </Link>
            </Button>
          </>
        );
    }
  };
  
  return (
    <motion.div 
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center space-x-4">
        {getButtons()}
      </div>
    </motion.div>
  );
};

export default AuthButtons;
