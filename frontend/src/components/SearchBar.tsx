
import React, { useState, useRef, useEffect } from "react";
import { Search, X, Mic, Command, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
  expanded?: boolean;
  onSearch?: (query: string) => void;
  placeholder?: string;
  showShortcut?: boolean;
  animated?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  className,
  expanded = false,
  onSearch,
  placeholder = "Search files across all your storage...",
  showShortcut = true,
  animated = false
}) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(expanded);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query);
    }
  };
  
  const clearSearch = () => {
    setQuery("");
    searchInputRef.current?.focus();
  };
  
  useEffect(() => {
    if (expanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [expanded]);
  
  return (
    <form 
      onSubmit={handleSearch}
      className={cn(
        "relative group",
        className
      )}
    >
      <div className={cn(
        "flex items-center w-full overflow-hidden transition-all duration-300 ease-out",
        isFocused ? 
          "bg-white dark:bg-white/5 border-white/30 dark:border-white/10 shadow-lg" : 
          "bg-secondary/80 border-transparent",
        "rounded-full border backdrop-blur-md px-4 h-12",
        isFocused && "ring-2 ring-primary/10"
      )}>
        <Search 
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-opacity",
            query && "opacity-0 w-0"
          )}
        />
        
        <input
          ref={searchInputRef}
          type="text"
          className={cn(
            "bg-transparent border-none flex-1 text-foreground placeholder:text-muted-foreground focus:outline-none",
            "h-full py-2 px-3",
            animated && query === "" && "animate-pulse-light"
          )}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(expanded)}
        />
        
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="p-1 rounded-full hover:bg-secondary transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        
        <div className="h-5 w-px bg-border mx-2"></div>
        
        <button
          type="button"
          className="p-1.5 rounded-full hover:bg-secondary transition-colors"
          aria-label="Voice search"
        >
          <Mic className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <button
          type="submit"
          className={cn(
            "ml-2 p-2 rounded-full text-white transition-all duration-200 flex items-center justify-center",
            query ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground",
            query && "animate-scale-in"
          )}
          disabled={!query}
          aria-label="Search"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      
      {showShortcut && (
        <div className={cn(
          "absolute right-4 -bottom-8 text-xs text-muted-foreground flex items-center space-x-1",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        )}>
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px]">
            <Command className="h-3 w-3 inline mr-0.5" />
            K
          </kbd>
          <span>to search</span>
        </div>
      )}
    </form>
  );
};

export default SearchBar;
