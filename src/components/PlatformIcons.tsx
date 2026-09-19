import React from 'react';

interface PlatformIconProps {
  platformId: string;
  size?: number;
  className?: string;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({ 
  platformId, 
  size = 24, 
  className = '' 
}) => {
  const s = size;

  switch (platformId.toLowerCase()) {
    case 'youtube':
      return (
        <svg 
          width={s} 
          height={s} 
          viewBox="0 0 24 24" 
          fill="none" 
          className={className}
        >
          <rect width="24" height="24" rx="6" fill="#FF0000" />
          <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="white" />
        </svg>
      );

    case 'tiktok':
      return (
        <svg 
          width={s} 
          height={s} 
          viewBox="0 0 24 24" 
          fill="none" 
          className={className}
        >
          <rect width="24" height="24" rx="6" fill="#010101" />
          {/* Cyan layer offset */}
          <path 
            d="M16.5 7.2C15.3 7 14.3 6.2 13.9 5H11.5V15.2C11.3 16.4 10.2 17.2 9 17C7.8 16.8 7 15.7 7.2 14.5C7.4 13.5 8.3 12.8 9.3 12.8C9.7 12.8 10 12.9 10.3 13.1V10.7C9.9 10.6 9.6 10.5 9.2 10.5C6.9 10.5 5 12.4 5 14.7C5 17 6.9 18.9 9.2 18.9C11.4 18.9 13.2 17.3 13.5 15.1V8.9C14.7 9.8 16.2 10.3 17.8 10.3V8.1C17.3 8.1 16.9 7.7 16.5 7.2Z" 
            fill="#25F4EE" 
            transform="translate(-0.8, -0.6)"
          />
          {/* Pink/Red layer offset */}
          <path 
            d="M16.5 7.2C15.3 7 14.3 6.2 13.9 5H11.5V15.2C11.3 16.4 10.2 17.2 9 17C7.8 16.8 7 15.7 7.2 14.5C7.4 13.5 8.3 12.8 9.3 12.8C9.7 12.8 10 12.9 10.3 13.1V10.7C9.9 10.6 9.6 10.5 9.2 10.5C6.9 10.5 5 12.4 5 14.7C5 17 6.9 18.9 9.2 18.9C11.4 18.9 13.2 17.3 13.5 15.1V8.9C14.7 9.8 16.2 10.3 17.8 10.3V8.1C17.3 8.1 16.9 7.7 16.5 7.2Z" 
            fill="#FE2C55" 
            transform="translate(0.8, 0.6)"
          />
          {/* Main White note */}
          <path 
            d="M16.5 7.2C15.3 7 14.3 6.2 13.9 5H11.5V15.2C11.3 16.4 10.2 17.2 9 17C7.8 16.8 7 15.7 7.2 14.5C7.4 13.5 8.3 12.8 9.3 12.8C9.7 12.8 10 12.9 10.3 13.1V10.7C9.9 10.6 9.6 10.5 9.2 10.5C6.9 10.5 5 12.4 5 14.7C5 17 6.9 18.9 9.2 18.9C11.4 18.9 13.2 17.3 13.5 15.1V8.9C14.7 9.8 16.2 10.3 17.8 10.3V8.1C17.3 8.1 16.9 7.7 16.5 7.2Z" 
            fill="#FFFFFF" 
          />
        </svg>
      );

    case 'instagram':
      return (
        <svg 
          width={s} 
          height={s} 
          viewBox="0 0 24 24" 
          fill="none" 
          className={className}
        >
          <defs>
            <linearGradient id="igGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFDC80" />
              <stop offset="25%" stopColor="#F77737" />
              <stop offset="50%" stopColor="#F56040" />
              <stop offset="75%" stopColor="#FD1D1D" />
              <stop offset="100%" stopColor="#C13584" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill="url(#igGradient)" />
          {/* Outer camera outline */}
          <rect 
            x="5.5" 
            y="5.5" 
            width="13" 
            height="13" 
            rx="3.5" 
            stroke="white" 
            strokeWidth="1.6" 
            fill="none" 
          />
          {/* Lens */}
          <circle 
            cx="12" 
            cy="12" 
            r="3.2" 
            stroke="white" 
            strokeWidth="1.6" 
            fill="none" 
          />
          {/* Flash dot */}
          <circle cx="15.8" cy="8.2" r="0.8" fill="white" />
        </svg>
      );

    case 'facebook':
      return (
        <svg 
          width={s} 
          height={s} 
          viewBox="0 0 24 24" 
          fill="none" 
          className={className}
        >
          <rect width="24" height="24" rx="6" fill="#1877F2" />
          <path 
            d="M15.5 12.8L16 9.5H12.8V7.4C12.8 6.5 13.2 5.7 14.6 5.7H16.1V2.9C15.8 2.8 14.7 2.7 13.5 2.7C11 2.7 9.3 4.2 9.3 6.9V9.5H6.5V12.8H9.3V21H12.8V12.8H15.5Z" 
            fill="white" 
          />
        </svg>
      );

    case 'twitter':
    case 'x':
      return (
        <svg 
          width={s} 
          height={s} 
          viewBox="0 0 24 24" 
          fill="none" 
          className={className}
        >
          <rect width="24" height="24" rx="6" fill="#000000" />
          <path 
            d="M17.5 4H19.5L14.9 9.3L20.3 16.5H16.1L12.8 12.2L9 16.5H7L11.9 10.9L6.7 4H11L14 8L17.5 4ZM16.8 15.3H17.9L10.2 5.1H9L16.8 15.3Z" 
            fill="white" 
          />
        </svg>
      );

    case 'reddit':
      return (
        <svg 
          width={s} 
          height={s} 
          viewBox="0 0 24 24" 
          fill="none" 
          className={className}
        >
          <rect width="24" height="24" rx="6" fill="#FF4500" />
          {/* Reddit Snoo face */}
          <circle cx="12" cy="13.2" r="5.2" fill="white" />
          {/* Eyes */}
          <circle cx="10" cy="13" r="1.1" fill="#FF4500" />
          <circle cx="14" cy="13" r="1.1" fill="#FF4500" />
          {/* Smile */}
          <path 
            d="M10.2 15.5C11.1 16.2 12.9 16.2 13.8 15.5" 
            stroke="#FF4500" 
            strokeWidth="0.9" 
            strokeLinecap="round" 
          />
          {/* Ears */}
          <circle cx="6.5" cy="13" r="1.3" fill="white" />
          <circle cx="17.5" cy="13" r="1.3" fill="white" />
          {/* Antenna */}
          <path 
            d="M12 8V6L15 5.2" 
            stroke="white" 
            strokeWidth="1.1" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none" 
          />
          <circle cx="15.8" cy="5.2" r="1" fill="white" />
        </svg>
      );

    case 'pinterest':
      return (
        <svg 
          width={s} 
          height={s} 
          viewBox="0 0 24 24" 
          fill="none" 
          className={className}
        >
          <rect width="24" height="24" rx="6" fill="#E60023" />
          <path 
            d="M12 4C7.6 4 4 7.6 4 12C4 15.4 6.1 18.3 9.2 19.4C9.1 18.8 9.1 17.8 9.2 17.2C9.4 16.5 10.3 12.6 10.3 12.6C10.3 12.6 10.1 12.1 10.1 11.4C10.1 10.3 10.7 9.5 11.5 9.5C12.2 9.5 12.5 10 12.5 10.6C12.5 11.3 12 12.4 11.8 13.4C11.6 14.2 12.2 14.9 13 14.9C14.5 14.9 15.6 13.3 15.6 11.1C15.6 9.1 14.2 7.7 12.1 7.7C9.7 7.7 8.3 9.5 8.3 11.3C8.3 12 8.6 12.8 8.9 13.2C9 13.3 9 13.4 9 13.5C8.9 13.8 8.8 14.4 8.7 14.6C8.7 14.7 8.6 14.8 8.4 14.7C7.4 14.2 6.8 12.8 6.8 11.2C6.8 8.7 8.6 6.5 12.3 6.5C15.2 6.5 17.5 8.6 17.5 11.3C17.5 14.2 15.7 16.5 13.1 16.5C12.2 16.5 11.4 16 11.1 15.5L10.5 17.8C10.3 18.6 9.8 19.6 9.4 20.2C10.2 20.5 11.1 20.6 12 20.6C16.4 20.6 20 17 20 12.6C20 8.1 16.4 4 12 4Z" 
            fill="white" 
          />
        </svg>
      );

    case 'vimeo':
      return (
        <svg 
          width={s} 
          height={s} 
          viewBox="0 0 24 24" 
          fill="none" 
          className={className}
        >
          <rect width="24" height="24" rx="6" fill="#1AB7EA" />
          <path 
            d="M18.8 8.2C18.7 9.8 17.5 12 15.2 14.8C12.9 17.6 11 19 9.6 19C8.7 19 8 18.2 7.4 16.5L6.2 12C5.8 10.4 5.3 9.6 4.7 9.6C4.6 9.6 4.1 9.8 3.3 10.3L2.5 9.3C3.6 8.3 4.8 7.3 6.1 6.3C7.2 5.4 8.1 4.9 8.8 4.9C9.7 4.9 10.3 5.5 10.6 6.8C10.9 8.2 11.2 9.5 11.5 10.8C11.9 12.4 12.4 13.2 12.9 13.2C13.3 13.2 13.9 12.4 14.7 10.9C15.5 9.3 15.9 8.3 15.9 7.8C15.9 7 15.4 6.6 14.4 6.6C14.9 5.3 15.8 4.6 17.2 4.6C18.2 4.6 18.7 5.8 18.8 8.2Z" 
            fill="white" 
          />
        </svg>
      );

    case 'dailymotion':
      return (
        <svg 
          width={s} 
          height={s} 
          viewBox="0 0 24 24" 
          fill="none" 
          className={className}
        >
          <rect width="24" height="24" rx="6" fill="#0066DC" />
          {/* Bold stylized lowercase d */}
          <path 
            d="M13.8 4V10.2C13.2 9.7 12.4 9.4 11.4 9.4C9.2 9.4 7.5 11.1 7.5 13.6C7.5 16.1 9.2 17.8 11.4 17.8C12.4 17.8 13.2 17.5 13.8 17V17.8H16.5V4H13.8ZM12 15.4C10.8 15.4 9.9 14.6 9.9 13.6C9.9 12.6 10.8 11.8 12 11.8C13.2 11.8 14.1 12.6 14.1 13.6C14.1 14.6 13.2 15.4 12 15.4Z" 
            fill="white" 
          />
        </svg>
      );

    default:
      return (
        <svg 
          width={s} 
          height={s} 
          viewBox="0 0 24 24" 
          fill="none" 
          className={className}
        >
          <rect width="24" height="24" rx="6" fill="#062630" stroke="#00ffd5" strokeWidth="1.2" />
          <path d="M10 8L16 12L10 16V8Z" fill="#00ffd5" />
        </svg>
      );
  }
};
