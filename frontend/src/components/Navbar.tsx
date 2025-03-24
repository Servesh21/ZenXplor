
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchBar from "./SearchBar";
import AuthButtons from "./AuthButtons";
import ThemeToggle from "./ThemeToggle";

const NavBar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false);
    
    if (location.pathname !== "/") {
      // If not on homepage, navigate to homepage with a section hash
      navigate(`/#${sectionId}`);
    } else {
      // If already on homepage, just scroll to the section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? 
          "bg-white/80 dark:bg-gray-900/90 backdrop-blur-lg border-b border-border/40 py-3" : 
          "bg-transparent py-4"
      )}
    >
      <div className="container px-4 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 flex items-center justify-center text-white font-bold text-xl">
            Z
          </div>
          <span className={cn(
            "font-bold text-xl",
            isScrolled ? "text-foreground" : "text-foreground"
          )}>
            ZenXplor
          </span>
        </Link>
        
        <div className="hidden md:flex md:items-center md:gap-1">
          <button 
            onClick={() => scrollToSection('hero')} 
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </button>
          <button 
            onClick={() => scrollToSection('features')} 
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('how-it-works')} 
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </button>
          <button 
            onClick={() => scrollToSection('pricing')} 
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </button>
          <Link to="/dashboard" className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </div>
        
        <div className="hidden md:flex md:items-center md:gap-2">
          <ThemeToggle />
          <div className="w-px h-6 bg-border mx-2"></div>
          <AuthButtons variant="outline" />
        </div>
        
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-sm flex flex-col p-6">
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => scrollToSection('hero')}
              className="px-4 py-3 text-lg font-medium border-b border-border"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('features')}
              className="px-4 py-3 text-lg font-medium border-b border-border"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="px-4 py-3 text-lg font-medium border-b border-border"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="px-4 py-3 text-lg font-medium border-b border-border"
            >
              Pricing
            </button>
            <Link 
              to="/dashboard" 
              className="px-4 py-3 text-lg font-medium border-b border-border"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
          </div>
          
          <div className="mt-8">
            <AuthButtons className="flex flex-col gap-3 w-full" />
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;
