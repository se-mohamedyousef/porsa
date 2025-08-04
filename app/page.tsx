"use client";

import PortfolioTracker from "./components/PortfolioTracker";
import LoginForm from "./components/LoginForm";
import { useUserData } from "./hooks/useUserData";
import { useState, useEffect } from "react";

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-sm">P</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1 w-full max-w-3xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
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
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-blur]:bg-background/60">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                P
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold">Porsa</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-1 sm:space-y-0 mt-2 sm:mt-0 w-full sm:w-auto">
            {currentUser && (
              <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
                <div className="text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-none">
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
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left w-full sm:w-auto">
              EGX Portfolio Tracker
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Dashboard({ currentUser }: { currentUser: any }) {
  const { userProfile, saveUserProfile } = useUserData(currentUser?.id);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-background border rounded-lg shadow-sm p-2 sm:p-4">
        <PortfolioTracker userId={currentUser?.id} />
      </div>
    </div>
  );
}
