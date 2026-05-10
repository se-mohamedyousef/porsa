"use client";

import SimpleDashboard from "./components/SimpleDashboard";
import LoginForm from "./components/LoginForm";
import ResetPasswordForm from "./components/ResetPasswordForm";
import LoadingSpinner from "./components/LoadingSpinner";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Define a type for the user object to avoid 'never' type errors
type User = {
  id?: string;
  name?: string;
  phone?: string;
  [key: string]: any;
};

function HomeContent() {
  return <MainApp />;
}

function MainApp() {
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token");

  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("porsaCurrentUser");
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Show reset password form if token is present
  if (resetToken) {
    return <ResetPasswordForm token={resetToken} />;
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Show simplified dashboard
  return (
    <SimpleDashboard userId={currentUser?.id} onLogout={handleLogout} />
  );
}


export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeContent />
    </Suspense>
  );
}
