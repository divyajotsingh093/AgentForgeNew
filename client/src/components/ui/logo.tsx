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
        {/* Vortex spiral design */}
        <defs>
          <linearGradient id="vortexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="text-primary" stopColor="currentColor" />
            <stop offset="100%" className="text-secondary" stopColor="currentColor" />
          </linearGradient>
        </defs>
        
        {/* Outer spiral arc 1 */}
        <path
          d="M50 5 A45 45 0 0 1 95 50"
          className="stroke-primary"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Outer spiral arc 2 */}
        <path
          d="M95 50 A45 45 0 0 1 50 95"
          className="stroke-secondary"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Middle spiral */}
        <path
          d="M50 20 A30 30 0 0 1 80 50 A30 30 0 0 1 50 80"
          className="stroke-primary"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Inner spiral */}
        <path
          d="M50 35 A15 15 0 0 1 65 50 A15 15 0 0 1 50 65 A15 15 0 0 1 35 50"
          className="stroke-secondary"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Central core with gradient */}
        <circle cx="50" cy="50" r="8" fill="url(#vortexGradient)" />
        
        {/* Animated rotating effect */}
        <g style={{ transformOrigin: '50px 50px' }}>
          <circle cx="50" cy="50" r="20" className="stroke-primary opacity-30" strokeWidth="2" fill="none">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 50 50"
              to="360 50 50"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>
    </div>
  );
}
