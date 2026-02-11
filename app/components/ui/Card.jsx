export default function Card({
  children,
  className = "",
  padding = "default",
  hover = false,
  ...props
}) {
  const baseStyles = "bg-white rounded-lg shadow-sm border border-gray-100";
  
  const paddingStyles = {
    none: "",
    sm: "p-4",
    default: "p-6",
    lg: "p-8",
  };
  
  const hoverStyles = hover ? "hover:shadow-md transition-shadow" : "";
  
  const paddingClass = paddingStyles[padding] || paddingStyles.default;
  
  return (
    <div
      className={`${baseStyles} ${paddingClass} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-800 ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = "" }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
