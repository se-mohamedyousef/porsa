"use client";

import PortfolioTracker from "./components/PortfolioTracker";
import LoginForm from "./components/LoginForm";
import ResetPasswordForm from "./components/ResetPasswordForm";
import ProfilePage from "./components/ProfilePage";
import LoadingSpinner from "./components/LoadingSpinner";
import ThemeToggle from "./components/ThemeToggle";
import LanguageToggle from "./components/LanguageToggle";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Responsive container max width for desktop, tablet, and mobile
const CONTAINER_MAX_WIDTH = "max-w-7xl"; // wider for desktop

// Define a type for the user object to avoid 'never' type errors
type User = {
  id?: string;
  name?: string;
  phone?: string;
  [key: string]: any;
};

import SidebarMenu from "./components/SidebarMenu";

function HomeContent() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}

function MainApp() {
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token");

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const { t } = useLanguage();

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

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("porsaCurrentUser");
    setShowProfile(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 px-4">
        <div className="text-center w-full max-w-xs mx-auto animate-fade-in">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse-subtle hover-glow">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <p className="text-muted-foreground text-lg font-medium animate-pulse">
            {t('loading')}
          </p>
        </div>
      </div>
    );
  }

  // Show reset password form if token is present
  if (resetToken) {
    return <ResetPasswordForm token={resetToken} />;
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Show profile page if requested
  if (showProfile) {
    return (
      <ProfilePage
        currentUser={currentUser}
        onBack={() => setShowProfile(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex flex-col animate-fade-in">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowProfile={() => setShowProfile(true)}
      />
      <main
        className={`flex-1 w-full ${CONTAINER_MAX_WIDTH} mx-auto px-2 md:px-6 lg:px-8 py-4 md:py-8`}
      >
        <Dashboard
          currentUser={currentUser}
        />
      </main>
    </div>
  );
}

function Header({
  currentUser,
  onLogout,
  onShowProfile,
}: {
  currentUser: User;
  onLogout: () => void;
  onShowProfile: () => void;
}) {
  const { t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <>
      <header className="glass-strong border-b border-white/20 dark:border-gray-700/30 w-full shadow-lg sticky top-0 z-50 animate-slide-down">
        <div
          className={`w-full ${CONTAINER_MAX_WIDTH} mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-5`}
        >
          <div className="flex items-center justify-between gap-3 w-full">
            {/* Logo Area */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-9 h-9 md:w-10 md:h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg hover-glow transition-all cursor-pointer hover-lift">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                {t('porsa')}
              </h1>
            </div>

            {/* Desktop Actions (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-4 rtl:space-x-reverse">
                <LanguageToggle />
                <ThemeToggle />
                
                {currentUser && (
                <div className="flex items-center space-x-2 rtl:space-x-reverse pl-2 border-l border-gray-200 dark:border-gray-700 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-2">
                    <div className="text-sm text-muted-foreground truncate max-w-[120px]">
                     {currentUser.name || currentUser.phone}
                    </div>
                    <button
                    onClick={onShowProfile}
                    className="ml-2 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
                    >
                    {t('profile')}
                    </button>
                    <button
                    onClick={onLogout}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                    {t('logout')}
                    </button>
                </div>
                )}
            </div>

            {/* Mobile Burger Button (Visible on Mobile) */}
            <div className="flex md:hidden items-center gap-3">
               <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                 {currentUser?.name?.split(' ')[0] || 'User'}
               </span>
               <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className="p-2 rounded-lg bg-gray-100/50 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700/50 transition-colors"
               >
                 <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
                 </svg>
               </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Component */}
      <SidebarMenu 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={onLogout}
        onShowProfile={onShowProfile}
      />
    </>
  );
}

function Dashboard({
  currentUser,
}: {
  currentUser: User;
}) {
  return (
    <div className="space-y-6 w-full">
      <div className="bg-accent border border-blue-100 rounded-lg shadow-sm p-2 md:p-6 w-full">
        <PortfolioTracker userId={currentUser?.id} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-primary-foreground font-bold text-xl sm:text-2xl">P</span>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>}>
      <HomeContent />
    </Suspense>
  );
}
