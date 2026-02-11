export default function Skeleton({
  variant = "text",
  width = "100%",
  height,
  className = "",
  ...props
}) {
  const baseStyles = "animate-pulse bg-gray-200 rounded";
  
  const variants = {
    text: "h-4",
    title: "h-6",
    circle: "rounded-full",
    rectangular: "rounded-md",
  };
  
  const variantClass = variants[variant] || variants.text;
  
  const style = {
    width,
    ...(height && { height }),
  };
  
  return (
    <div
      className={`${baseStyles} ${variantClass} ${className}`}
      style={style}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="space-y-3">
        <Skeleton variant="title" width="60%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="85%" />
        <div className="flex gap-2 mt-4">
          <Skeleton variant="rectangular" width="80px" height="32px" />
          <Skeleton variant="rectangular" width="80px" height="32px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 / columns}%`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width={`${100 / columns}%`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
