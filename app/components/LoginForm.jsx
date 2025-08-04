"use client";

import { useState } from "react";

export default function LoginForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login logic
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: formData.phone,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Store current user session
          localStorage.setItem("porsaCurrentUser", JSON.stringify(data.user));
          onLogin(data.user);
        } else {
          setError(data.error || "Invalid phone or password");
        }
      } else {
        // Register logic
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: formData.phone,
            password: formData.password,
            name: formData.name,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Store current user session
          localStorage.setItem("porsaCurrentUser", JSON.stringify(data.user));
          onLogin(data.user);
        } else {
          setError(data.error || "Failed to create account");
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-2 sm:px-0">
      <div className="w-full max-w-md sm:max-w-md space-y-8 p-4 sm:p-8 bg-white/90 rounded-lg shadow-md border border-border">
        <div className="text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-xl sm:text-2xl">
              P
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            {isLogin
              ? "Sign in to your account"
              : "Join Porsa to track your portfolio"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                Full Name
              </label>
              <input
                type="text"
                required={!isLogin}
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2">
              Phone
            </label>
            <input
              type="phone"
              required
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-2">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Your password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-xs sm:text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs sm:text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isLogin ? "Signing In..." : "Creating Account..."}
              </>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs sm:text-sm text-primary hover:underline mt-2"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
