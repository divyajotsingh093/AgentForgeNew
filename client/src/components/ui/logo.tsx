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
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(150, 80%, 45%)' }} />
            <stop offset="100%" style={{ stopColor: 'hsl(180, 75%, 50%)' }} />
          </linearGradient>
          <linearGradient id="logoGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(180, 75%, 50%)' }} />
            <stop offset="100%" style={{ stopColor: 'hsl(150, 80%, 45%)' }} />
          </linearGradient>
        </defs>
        
        {/* Stylized V letter with geometric design */}
        <path
          d="M30 20 L50 65 L70 20"
          stroke="url(#logoGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Inner geometric accent */}
        <path
          d="M38 30 L50 55 L62 30"
          stroke="url(#logoGradient2)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.6"
        />
        
        {/* Bottom circle/node */}
        <circle cx="50" cy="70" r="10" fill="url(#logoGradient)" />
        
        {/* Small accent circles */}
        <circle cx="30" cy="22" r="4" fill="url(#logoGradient)" />
        <circle cx="70" cy="22" r="4" fill="url(#logoGradient2)" />
        
        {/* Orbital ring */}
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          stroke="url(#logoGradient)" 
          strokeWidth="2" 
          fill="none"
          opacity="0.3"
        />
        
        {/* Animated pulse */}
        <circle cx="50" cy="70" r="10" fill="url(#logoGradient)" opacity="0.3">
          <animate
            attributeName="r"
            values="10;14;10"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.3;0.1;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
