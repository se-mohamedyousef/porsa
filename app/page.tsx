"use client";

import PortfolioTracker from "./components/PortfolioTracker";
import LoginForm from "./components/LoginForm";
import { useUserData } from "./hooks/useUserData";
import { useState, useEffect } from "react";

// Responsive container max width for desktop, tablet, and mobile
const CONTAINER_MAX_WIDTH = "max-w-7xl"; // wider for desktop

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("porsaCurrentUser");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error loading user session:", error);
        localStorage.removeItem("porsaCurrentUser");
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("porsaCurrentUser");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center w-full max-w-xs mx-auto">
          <div className="w-12 h-12 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-lg sm:text-sm">
              P
            </span>
          </div>
          <p className="text-muted-foreground text-base sm:text-sm">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-2">
        <div className="w-full max-w-sm">
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header currentUser={currentUser} onLogout={handleLogout} />
      <main
        className={`flex-1 w-full ${CONTAINER_MAX_WIDTH} mx-auto px-2 md:px-6 lg:px-8 py-4 md:py-8`}
      >
        <Dashboard currentUser={currentUser} />
      </main>
    </div>
  );
}

function Header({
  currentUser,
  onLogout,
}: {
  currentUser: any;
  onLogout: () => void;
}) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-blur]:bg-background/60 w-full">
      <div
        className={`w-full ${CONTAINER_MAX_WIDTH} mx-auto px-2 md:px-6 lg:px-8 py-3 md:py-4`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 w-full">
          <div className="flex items-center space-x-2 w-full md:w-auto justify-center md:justify-start">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                P
              </span>
            </div>
            <h1 className="text-lg md:text-2xl font-bold">Porsa</h1>
          </div>
          <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-1 md:space-y-0 mt-2 md:mt-0 w-full md:w-auto">
            {currentUser && (
              <div className="flex items-center space-x-2 md:space-x-4 w-full md:w-auto justify-center md:justify-end">
                <div className="text-sm text-muted-foreground truncate max-w-[120px] md:max-w-none">
                  👤 {currentUser.name || currentUser.phone}
                </div>
                <button
                  onClick={onLogout}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
            <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left w-full md:w-auto">
              EGX Portfolio Tracker
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Dashboard({ currentUser }: { currentUser: any }) {
  return (
    <div className="space-y-4 md:space-y-6 w-full">
      <div className="bg-background border rounded-lg shadow-sm p-2 md:p-6 w-full">
        <PortfolioTracker userId={currentUser?.id} />
      </div>
    </div>
  );
}
