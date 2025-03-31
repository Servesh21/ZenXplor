
// Animation preset objects for framer-motion

export const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { duration: 0.2, ease: "easeOut" }
};

export const slideIn = (direction = "left", duration = 0.3) => {
  const x = direction === "left" ? -20 : direction === "right" ? 20 : 0;
  const y = direction === "up" ? 20 : direction === "down" ? -20 : 0;
  
  return {
    initial: { opacity: 0, x, y },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x, y },
    transition: { duration, ease: "easeOut" }
  };
};

export const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren
    }
  }
});

export const typingContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

export const typingCharacter = {
  hidden: { opacity: 0, y: 5 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 12,
      stiffness: 200
    }
  }
};
