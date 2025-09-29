import React, { useEffect } from 'react';

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: 'chars' | 'words' | 'lines';
  from?: { opacity: number; y: number };
  to?: { opacity: number; y: number };
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 100,
  duration = 0.6,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  tag = 'h1',
  textAlign = 'center',
  onLetterAnimationComplete
}) => {
  useEffect(() => {
    if (onLetterAnimationComplete) {
      // Calculate total animation time based on text length and delay
      const totalTime = text.length * delay + (duration * 1000);
      const timer = setTimeout(onLetterAnimationComplete, totalTime);
      return () => clearTimeout(timer);
    }
  }, [onLetterAnimationComplete, text.length, delay, duration]);

  const baseClasses = `split-parent overflow-hidden inline-block whitespace-normal ${className}`;
  
  // Responsive font sizes based on screen size with Tailwind
  const getFontSizeClasses = () => {
    switch (tag) {
      case 'h1':
        return 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black';
      case 'h2':
        return 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black';
      case 'h3':
        return 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold';
      default:
        return 'text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold';
    }
  };

  const style: React.CSSProperties = {
    textAlign,
    wordWrap: 'break-word',
    willChange: 'transform, opacity'
  };

  const renderSplitText = () => {
    const fontSizeClasses = getFontSizeClasses();
    const fullClasses = `${baseClasses} ${fontSizeClasses} text-center leading-tight tracking-tight`;
    
    const content = (
      <>
        {text.split('').map((char: string, index: number) => {
          // Create two-tone gradient effect by alternating colors
          const isFirstHalf = index < text.length / 2;
          const gradientClass = isFirstHalf 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent';
          
          return (
            <span
              key={index}
              className={`split-char inline-block opacity-0 ${gradientClass}`}
              style={{
                animationDelay: `${index * (delay / 1000)}s`,
                animationFillMode: 'forwards',
                animationName: 'bounceInUp',
                animationDuration: `${duration}s`,
                animationTimingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                transform: `translateY(${from.y}px)`,
                opacity: from.opacity
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </>
    );

    switch (tag) {
      case 'h1':
        return <h1 style={style} className={fullClasses}>{content}</h1>;
      case 'h2':
        return <h2 style={style} className={fullClasses}>{content}</h2>;
      case 'h3':
        return <h3 style={style} className={fullClasses}>{content}</h3>;
      case 'h4':
        return <h4 style={style} className={fullClasses}>{content}</h4>;
      case 'h5':
        return <h5 style={style} className={fullClasses}>{content}</h5>;
      case 'h6':
        return <h6 style={style} className={fullClasses}>{content}</h6>;
      case 'span':
        return <span style={style} className={fullClasses}>{content}</span>;
      default:
        return <p style={style} className={fullClasses}>{content}</p>;
    }
  };

  return (
    <>
      {renderSplitText()}
      <style jsx global>{`
        @keyframes bounceInUp {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(0.3);
          }
          50% {
            opacity: 1;
            transform: translateY(-10px) scale(1.05);
          }
          70% {
            transform: translateY(2px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }
        
        .split-char {
          will-change: transform, opacity;
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `}</style>
    </>
  );
};

export default SplitText;
