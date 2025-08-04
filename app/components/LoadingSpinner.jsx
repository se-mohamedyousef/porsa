export default function LoadingSpinner({ size = "md", className = "" }) {
  // Responsive size classes for mobile and up
  const sizeClasses = {
    sm: "w-4 h-4 sm:w-4 sm:h-4",
    md: "w-6 h-6 sm:w-6 sm:h-6",
    lg: "w-8 h-8 sm:w-8 sm:h-8",
    xl: "w-10 h-10 sm:w-12 sm:h-12", // slightly smaller on mobile
  };

  // Optionally, allow size to be responsive based on screen size
  // e.g., md: "w-6 h-6 sm:w-8 sm:h-8" for larger spinner on desktop

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ minWidth: 0, minHeight: 0 }}
    >
      <svg
        className={`animate-spin ${sizeClasses[size]}`}
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
    </div>
  );
}
