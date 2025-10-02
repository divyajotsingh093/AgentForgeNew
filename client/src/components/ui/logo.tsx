export default function Logo({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer circle with gradient */}
        <circle cx="50" cy="50" r="45" className="fill-primary/20" />
        
        {/* Flow lines representing agent workflow */}
        <path
          d="M20 35 L35 35 L45 50 L35 65 L20 65"
          className="stroke-primary"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M55 50 L65 35 L80 35"
          className="stroke-primary"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M55 50 L65 65 L80 65"
          className="stroke-primary"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Central node */}
        <circle cx="50" cy="50" r="8" className="fill-primary" />
        
        {/* Connection nodes */}
        <circle cx="27.5" cy="35" r="4" className="fill-primary" />
        <circle cx="27.5" cy="65" r="4" className="fill-primary" />
        <circle cx="72.5" cy="35" r="4" className="fill-primary" />
        <circle cx="72.5" cy="65" r="4" className="fill-primary" />
        
        {/* Animated pulse effect */}
        <circle cx="50" cy="50" r="8" className="fill-primary opacity-50">
          <animate
            attributeName="r"
            values="8;12;8"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.1;0.5"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
