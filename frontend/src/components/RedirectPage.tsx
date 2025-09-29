'use client';
import React, { useEffect, useState } from 'react';

interface RedirectPageProps {
  title: string;
  subtitle?: string;
  redirectUrl: string;
  delay?: number;
  className?: string;
  onRedirect?: () => void;
}

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  onAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({ 
  text, 
  className = '', 
  delay = 100, 
  onAnimationComplete 
}) => {
  
  useEffect(() => {
    // Trigger callback after animation completes (3 seconds)
    if (onAnimationComplete) {
      const timer = setTimeout(onAnimationComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [onAnimationComplete]);

  return (
    <div className={`inline-block overflow-hidden ${className}`}>
      {text.split('').map((char: string, index: number) => (
        <span
          key={index}
          className="inline-block opacity-0 animate-[splitReveal_0.6s_cubic-bezier(0.77,0,0.175,1)_forwards]"
          style={{
            animationDelay: `${index * (delay / 1000)}s`,
            transform: 'translateY(40px)'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
};

const RedirectPage: React.FC<RedirectPageProps> = ({
  title,
  subtitle,
  redirectUrl,
  delay = 3000,
  className = '',
  onRedirect
}) => {
  const [showSubtitle, setShowSubtitle] = useState(false);

  const handleTitleComplete = () => {
    setShowSubtitle(true);
  };

  const handleSubtitleComplete = () => {
    // Start redirect after subtitle animation completes
    setTimeout(() => {
      if (onRedirect) {
        onRedirect();
      } else {
        window.location.href = redirectUrl;
      }
    }, delay);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative ${className}`}>
      {/* Custom styles for animations */}
      <style jsx global>{`
        @keyframes splitReveal {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-shape-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        .animate-shape-pulse-delayed {
          animation: pulse 2s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
      
      {/* Beautiful gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"></div>
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl animate-shape-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-3xl animate-shape-pulse-delayed"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Main title with split text animation */}
        <div className="mb-8">
          <SplitText
            text={title}
            delay={80}
            onAnimationComplete={handleTitleComplete}
          />
        </div>
        
        {/* Subtitle with delayed split text animation */}
        {subtitle && showSubtitle && (
          <div className="mb-8">
            <SplitText
              text={subtitle}
              delay={60}
              onAnimationComplete={handleSubtitleComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RedirectPage;