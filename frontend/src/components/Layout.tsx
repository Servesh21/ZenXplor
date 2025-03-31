
import React from "react";
import NavBar from "./NavBar";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  className,
  fullWidth = false
}) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex flex-col transition-colors duration-200">
        <NavBar />
        <main className={cn(
          "flex-1 pb-12",
          fullWidth ? "w-full" : "container px-4 md:px-6",
          className
        )}>
          {children}
        </main>
        <footer className="py-6 border-t border-border/40 bg-secondary/30 backdrop-blur-sm">
          <div className="container flex flex-col md:flex-row justify-between items-center gap-4 px-4 md:px-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Searchly Universe. All rights reserved.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
};

export default Layout;
