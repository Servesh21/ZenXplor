import React, { useState, useEffect } from "react";

interface TypingAnimationProps {
  textList: string[];
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({ textList }) => {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [textIndex, setTextIndex] = useState<number>(0);
  const [charIndex, setCharIndex] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);

  // Handle the typing/deleting animation
  useEffect(() => {
    const typingInterval = setInterval(() => {
      if (isTyping) {
        // Type forward
        if (charIndex < textList[textIndex].length) {
          setDisplayedText(textList[textIndex].substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          // Pause at the end of typing before deleting
          setTimeout(() => setIsTyping(false), 1000);
        }
      } else {
        // Delete backwards
        if (charIndex > 0) {
          setDisplayedText(textList[textIndex].substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          // Move to next text item
          setIsTyping(true);
          setTextIndex((textIndex + 1) % textList.length);
        }
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, [charIndex, isTyping, textIndex, textList]);

  // Handle cursor blinking
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span className="inline-flex relative mx-2 h-10">
      <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 text-transparent bg-clip-text">
        {displayedText}
      </span>
      <span className={`h-full w-0.5 bg-blue-500 dark:bg-blue-400 ${cursorVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}></span>
    </span>
  );
};

export default TypingAnimation;