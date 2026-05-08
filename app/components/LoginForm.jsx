"use client";

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function LoginForm({ onLogin }) {
  const { t } = useLanguage();
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-surface relative overflow-hidden">
      {/* Immersive background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-float-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-purple/10 rounded-full blur-[120px] animate-float-slow delay-500"></div>
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-accent-pink/5 rounded-full blur-[80px] animate-pulse-subtle"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-10 animate-scale-in relative overflow-hidden border-white/20 dark:border-white/5">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

          <div className="text-center mb-10 relative z-10">
            <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl animate-float relative">
              <div className="absolute inset-0 bg-white/20 rounded-3xl animate-pulse-subtle"></div>
              <span className="text-white font-extrabold text-3xl relative z-10">P</span>
            </div>
            <h2 className="text-4xl font-extrabold gradient-text mb-3 tracking-tight">
              {isForgotPassword
                ? "Reset Access"
                : isLogin
                ? "Welcome Back"
                : "Create Account"}
            </h2>
            <p className="text-muted-foreground text-sm font-medium">
              {isForgotPassword
                ? "Enter your email to receive a secure link"
                : isLogin
                ? "Sign in to manage your portfolio"
                : "Join Porsa for professional tracking"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {isForgotPassword ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                  Email Address
                </label>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="input-enhanced pl-14"
                    autoComplete="email"
                  />
                </div>
              </div>
            ) : (
              <>
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required={!isLogin}
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="input-enhanced"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                        Email Address
                      </label>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          required={!isLogin}
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="input-enhanced pl-14"
                          autoComplete="email"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                    Phone Number
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="input-enhanced pl-14"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Password
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError("");
                          setSuccessMessage("");
                        }}
                        className="text-xs text-primary hover:text-primary-dark font-bold transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className="input-enhanced pl-14"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm animate-shake">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-2xl text-sm animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">{successMessage}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center py-4 text-base font-bold disabled:opacity-70 disabled:cursor-not-allowed mt-8 shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
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

          <div className="text-center mt-10 relative z-10">
            {isForgotPassword ? (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setError("");
                  setSuccessMessage("");
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center justify-center gap-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Sign In
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccessMessage("");
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-all font-medium py-2 px-4 rounded-xl hover:bg-white/5"
              >
                {isLogin ? (
                  <>Don't have an account? <span className="text-primary font-bold ml-1">Create one</span></>
                ) : (
                  <>Already have an account? <span className="text-primary font-bold ml-1">Sign in</span></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
