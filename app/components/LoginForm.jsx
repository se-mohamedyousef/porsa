"use client";

import { useState } from "react";

export default function LoginForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (isForgotPassword) {
        // Forgot password logic
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccessMessage(
            "Password reset link sent! Check your email."
          );
          setFormData({ phone: "", password: "", name: "", email: "" });
        } else {
          setError(data.error || "Failed to send reset link");
        }
      } else if (isLogin) {
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
            email: formData.email,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 px-2 sm:px-0">
      <div className="w-full max-w-md sm:max-w-md space-y-8 p-6 sm:p-8 glass-card animate-fade-in shadow-xl">
        <div className="text-center animate-slide-down">
          <div className="w-16 h-16 sm:w-20 sm:h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg hover-glow animate-pulse-subtle">
            <span className="text-primary-foreground font-bold text-2xl sm:text-3xl">
              P
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isForgotPassword
              ? "Reset Password"
              : isLogin
              ? "Welcome Back"
              : "Create Account"}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            {isForgotPassword
              ? "Enter your email to receive a reset link"
              : isLogin
              ? "Sign in to your account"
              : "Join Porsa to track your portfolio"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 animate-slide-up">
          {isForgotPassword ? (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="input-enhanced w-full transition-all duration-200"
                autoComplete="email"
              />
            </div>
          ) : (
            <>
              {!isLogin && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required={!isLogin}
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="input-enhanced w-full transition-all duration-200"
                  />
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required={!isLogin}
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      handleInputChange("email", e.target.value)
                    }
                    className="input-enhanced w-full transition-all duration-200"
                    autoComplete="email"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="input-enhanced w-full transition-all duration-200"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="input-enhanced w-full transition-all duration-200"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>

              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError("");
                      setSuccessMessage("");
                    }}
                    className="text-xs sm:text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-xl text-sm animate-slide-down shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 rounded-xl text-sm animate-slide-down shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{successMessage}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full inline-flex items-center justify-center px-6 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5"
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
                {isForgotPassword
                  ? "Sending..."
                  : isLogin
                  ? "Signing In..."
                  : "Creating Account..."}
              </>
            ) : isForgotPassword ? (
              "Send Reset Link"
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="text-center">
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setError("");
                setSuccessMessage("");
              }}
              className="text-xs sm:text-sm text-primary hover:underline mt-2"
            >
              Back to Sign In
            </button>
          ) : (
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccessMessage("");
              }}
              className="text-xs sm:text-sm text-primary hover:underline mt-2"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
