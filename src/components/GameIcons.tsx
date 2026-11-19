import React from 'react';
import { FoodItemType } from '../types';

export const HatStickerIcon: React.FC<{
  hatId: string;
  className?: string;
}> = ({ hatId, className = 'w-6 h-6' }) => {
  const cls = `shrink-0 ${className}`;
  switch (hatId) {
    case 'straw-hat':
      return (
        <svg viewBox="0 0 40 40" className={cls} fill="none" aria-hidden="true">
          <ellipse cx="20" cy="26" rx="17" ry="5.5" fill="#FFE07D" stroke="#8E6A56" strokeWidth="2.4" />
          <path d="M9.5 25C10 14 30 14 30.5 25Z" fill="#FFF0AE" stroke="#8E6A56" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M10.5 22.5H29.5" stroke="#FF8DA1" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="26.5" cy="22.5" r="2.1" fill="#FFFDF9" stroke="#FF8DA1" strokeWidth="1.2" />
        </svg>
      );
    case 'ribbon-bow':
      return (
        <svg viewBox="0 0 40 40" className={cls} fill="none" aria-hidden="true">
          <path
            d="M19 20L7 12C5.5 16 5.5 24 7 28L19 20Z"
            fill="#FF9CC2"
            stroke="#8E6A56"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="M21 20L33 12C34.5 16 34.5 24 33 28L21 20Z"
            fill="#FF9CC2"
            stroke="#8E6A56"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path d="M16 23L12 32M24 23L28 32" stroke="#FF7AA8" strokeWidth="2.8" strokeLinecap="round" />
          <circle cx="20" cy="20" r="4.3" fill="#FFD3E5" stroke="#8E6A56" strokeWidth="2.3" />
        </svg>
      );
    case 'sunny-cap':
      return (
        <svg viewBox="0 0 40 40" className={cls} fill="none" aria-hidden="true">
          <path
            d="M7 25C7 14 29 14 29 25Z"
            fill="#8ED8FF"
            stroke="#8E6A56"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path d="M18 15V25" stroke="#5EB6E5" strokeWidth="1.8" />
          <circle cx="18" cy="13.5" r="2.2" fill="#FFE07D" stroke="#8E6A56" strokeWidth="1.6" />
          <path
            d="M22 25H36C35.5 28.5 29.5 30 22 27.5Z"
            fill="#68BFE8"
            stroke="#8E6A56"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'flower-crown':
      return (
        <svg viewBox="0 0 40 40" className={cls} fill="none" aria-hidden="true">
          <path d="M7 24C14 18 26 18 33 24" stroke="#7AC768" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="10.5" cy="22.5" r="5" fill="#FFA6C9" stroke="#8E6A56" strokeWidth="2" />
          <circle cx="10.5" cy="22.5" r="1.8" fill="#FFE07D" />
          <circle cx="20" cy="18.5" r="5.6" fill="#FFFDF9" stroke="#8E6A56" strokeWidth="2" />
          <circle cx="20" cy="18.5" r="2.1" fill="#FFE07D" />
          <circle cx="29.5" cy="22.5" r="5" fill="#9EDDFF" stroke="#8E6A56" strokeWidth="2" />
          <circle cx="29.5" cy="22.5" r="1.8" fill="#FFE07D" />
        </svg>
      );
    case 'top-hat':
      return (
        <svg viewBox="0 0 40 40" className={cls} fill="none" aria-hidden="true">
          <ellipse cx="20" cy="29" rx="15.5" ry="4.2" fill="#5D4B57" stroke="#3F313B" strokeWidth="2.3" />
          <rect x="10.5" y="9.5" width="19" height="19" rx="3.5" fill="#6E5B68" stroke="#3F313B" strokeWidth="2.3" />
          <rect x="11.5" y="22.5" width="17" height="3.8" fill="#FFE07D" />
        </svg>
      );
    case 'royal-crown':
      return (
        <svg viewBox="0 0 40 40" className={cls} fill="none" aria-hidden="true">
          <path
            d="M6.5 28L9 13L16.5 20L20 10L23.5 20L31 13L33.5 28Z"
            fill="#FFE07D"
            stroke="#8E6A56"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <rect x="7.5" y="26.5" width="25" height="4" rx="2" fill="#F5C34B" stroke="#8E6A56" strokeWidth="2" />
          <circle cx="20" cy="22.5" r="2.4" fill="#FF7CA3" />
          <circle cx="13" cy="23.5" r="1.8" fill="#7CCBFF" />
          <circle cx="27" cy="23.5" r="1.8" fill="#7CCBFF" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 40 40" className={cls} fill="none" aria-hidden="true">
          <ellipse cx="20" cy="26" rx="15" ry="5" fill="#FFE07D" stroke="#8E6A56" strokeWidth="2.4" />
          <path d="M11 25C11 16 29 16 29 25Z" fill="#FFF0AE" stroke="#8E6A56" strokeWidth="2.4" />
        </svg>
      );
  }
};

export const ToyStickerIcon: React.FC<{
  toyId?: string;
  name?: string;
  className?: string;
}> = ({ toyId = '', name = '', className = 'w-6 h-6' }) => {
  const cls = `shrink-0 ${className}`;
  const key = `${toyId} ${name}`.toLowerCase();

  if (key.includes('tennis')) {
    return (
      <svg viewBox="0 0 36 36" className={cls} fill="none" aria-hidden="true">
        <circle cx="18" cy="18" r="13.5" fill="#C9F06B" stroke="#6E8F43" strokeWidth="2.4" />
        <path d="M8.5 11.5C13 15 13 21 8.5 24.5" stroke="#FFFDF9" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M27.5 11.5C23 15 23 21 27.5 24.5" stroke="#FFFDF9" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (key.includes('duck') || key.includes('plush')) {
    return (
      <svg viewBox="0 0 36 36" className={cls} fill="none" aria-hidden="true">
        <ellipse cx="18" cy="24" rx="11" ry="7.5" fill="#FFE07D" stroke="#8E6A56" strokeWidth="2.2" />
        <circle cx="15" cy="14" r="6.8" fill="#FFE898" stroke="#8E6A56" strokeWidth="2.2" />
        <path d="M8.5 14.5C5.5 14.5 5.5 18 8.5 18.2H11.5V14.5H8.5Z" fill="#FF9E5E" stroke="#8E6A56" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="13.2" cy="13.2" r="1.5" fill="#4B3C46" />
        <ellipse cx="16.5" cy="16.2" rx="1.8" ry="1.1" fill="#FFA6C9" />
        <path d="M20 22.5C23.5 21 26.5 23 25.5 26" stroke="#D9A84E" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // Default: Yarn Ball
  return (
    <svg viewBox="0 0 36 36" className={cls} fill="none" aria-hidden="true">
      <path d="M26 27C29 29 31.5 28 33 25.5" stroke="#FF8FB5" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="17.5" cy="17.5" r="12.5" fill="#FFA8C8" stroke="#8E6A56" strokeWidth="2.3" />
      <path d="M8 14C13 11 21 12 27 16" stroke="#FFFDF9" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <path d="M7.5 20.5C13 18 21 19 27.5 22.5" stroke="#E06C97" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 6.5C15 12 16 20 14 28.5" stroke="#E06C97" strokeWidth="2" strokeLinecap="round" />
      <path d="M20.5 6.5C22.5 12 22 20 19.5 28.5" stroke="#FFFDF9" strokeWidth="1.9" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
};

export const BaitStickerIcon: React.FC<{
  baitName: string;
  className?: string;
}> = ({ baitName, className = 'w-6 h-6' }) => {
  const cls = `shrink-0 ${className}`;
  if (baitName === 'Salmon Pate') {
    return (
      <svg viewBox="0 0 36 36" className={cls} fill="none" aria-hidden="true">
        <path d="M25 18L33 12V24L25 18Z" fill="#FF9282" stroke="#8E6A56" strokeWidth="2.2" strokeLinejoin="round" />
        <ellipse cx="16.5" cy="18" rx="11.5" ry="7.5" fill="#FFAA99" stroke="#8E6A56" strokeWidth="2.2" />
        <path d="M15 11.5C17 15 17 21 15 24.5" stroke="#FFF0EB" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10.5" cy="16.8" r="1.7" fill="#4B3C46" />
      </svg>
    );
  }
  if (baitName === 'Honey Biscuit') {
    return (
      <svg viewBox="0 0 36 36" className={cls} fill="none" aria-hidden="true">
        <path
          d="M11 13.5C8.5 11.5 5 13 5.5 16C4 18 5.5 22.5 9.5 21.5L26.5 21.5C30.5 22.5 32 18 30.5 16C31 13 27.5 11.5 25 13.5H11Z"
          fill="#FFE08C"
          stroke="#8E6A56"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <circle cx="14.5" cy="17.5" r="1.1" fill="#C99652" />
        <circle cx="18" cy="17.5" r="1.1" fill="#C99652" />
        <circle cx="21.5" cy="17.5" r="1.1" fill="#C99652" />
      </svg>
    );
  }
  return <CropFoodIcon item="carrot" className={className} />;
};

export const CropFoodIcon: React.FC<{
  item: FoodItemType | 'sprout' | 'kibble';
  className?: string;
}> = ({ item, className = 'w-6 h-6' }) => {
  const cls = `shrink-0 ${className}`;
  switch (item) {
    case 'wheat':
      return (
        <svg viewBox="0 0 36 36" className={cls} fill="none" aria-hidden="true">
          <path d="M11 29L25 10" stroke="#B88746" strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="22" cy="11" rx="3" ry="5" transform="rotate(28 22 11)" fill="#FFE07D" stroke="#9C713B" strokeWidth="1.8" />
          <ellipse cx="17.5" cy="16.5" rx="3" ry="5" transform="rotate(28 17.5 16.5)" fill="#FFE07D" stroke="#9C713B" strokeWidth="1.8" />
          <ellipse cx="23.5" cy="18.5" rx="3" ry="5" transform="rotate(64 23.5 18.5)" fill="#F7CC5E" stroke="#9C713B" strokeWidth="1.8" />
          <ellipse cx="14" cy="21.5" rx="2.8" ry="4.6" transform="rotate(28 14 21.5)" fill="#FFE07D" stroke="#9C713B" strokeWidth="1.8" />
          <ellipse cx="19.5" cy="23.5" rx="2.8" ry="4.6" transform="rotate(64 19.5 23.5)" fill="#F7CC5E" stroke="#9C713B" strokeWidth="1.8" />
        </svg>
      );
    case 'carrot':
      return (
        <svg viewBox="0 0 36 36" className={cls} fill="none" aria-hidden="true">
          <path d="M23 11C24 6.5 27.5 5.5 28.5 8.5C31 8 31.5 11.5 27 13" fill="#7FD17A" stroke="#538D4E" strokeWidth="1.9" strokeLinejoin="round" />
          <path
            d="M25 14C27 17 20 27 10 30C8.5 30.5 7 29 7.5 27.5C10.5 17.5 19.5 10.5 25 14Z"
            fill="#FF984F"
            stroke="#9B6037"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M16 17.5L19 20.5M12.5 22L15 24.5" stroke="#E0752D" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'berry':
      return (
        <svg viewBox="0 0 36 36" className={cls} fill="none" aria-hidden="true">
          <path
            d="M18 30C12 28.5 8.5 21 9.5 15.5C10.5 11 14 10 18 11C22 10 25.5 11 26.5 15.5C27.5 21 24 28.5 18 30Z"
            fill="#FF7892"
            stroke="#9B4E5E"
            strokeWidth="2.2"
          />
          <path d="M13 11L18 14L23 11L20 7.5L18 9.5L16 7.5L13 11Z" fill="#7FD17A" stroke="#538D4E" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="14.5" cy="18" r="1.1" fill="#FFF3BF" />
          <circle cx="21" cy="17.5" r="1.1" fill="#FFF3BF" />
          <circle cx="18" cy="22.5" r="1.1" fill="#FFF3BF" />
          <circle cx="15" cy="24.5" r="1" fill="#FFF3BF" />
        </svg>
      );
    case 'catnip':
      return (
        <svg viewBox="0 0 36 36" className={cls} fill="none" aria-hidden="true">
          <path d="M18 30V15" stroke="#538D4E" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M18 16C18 9 11 7 9 12C8 16 13 19 18 16Z" fill="#8CE08A" stroke="#538D4E" strokeWidth="2" strokeLinejoin="round" />
          <path d="M18 16C18 9 25 7 27 12C28 16 23 19 18 16Z" fill="#A9ED9E" stroke="#538D4E" strokeWidth="2" strokeLinejoin="round" />
          <path d="M18 22C13 19 9 21 10 25C11.5 27.5 15.5 26 18 22Z" fill="#7FD17A" stroke="#538D4E" strokeWidth="2" strokeLinejoin="round" />
          <path d="M18 22C23 19 27 21 26 25C24.5 27.5 20.5 26 18 22Z" fill="#8CE08A" stroke="#538D4E" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case 'apple':
      return (
        <svg viewBox="0 0 36 36" className={cls} fill="none" aria-hidden="true">
          <path d="M18 11V7" stroke="#8E6A56" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M18.5 9.5C21.5 6 25.5 7 25 10.5C22.5 11.5 20 11 18.5 9.5Z" fill="#7FD17A" stroke="#538D4E" strokeWidth="1.7" />
          <path
            d="M18 12.5C14 10 8.5 13 9 19.5C9.5 26 14 30 18 28.8C22 30 26.5 26 27 19.5C27.5 13 22 10 18 12.5Z"
            fill="#FF7D85"
            stroke="#9B4E56"
            strokeWidth="2.2"
          />
          <path d="M13.5 16.5C12.5 18 12.5 20.5 13.5 22" stroke="#FFD6D9" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'peach':
      return (
        <svg viewBox="0 0 36 36" className={cls} fill="none" aria-hidden="true">
          <path d="M18 10.5C21 6.5 25.5 7 25 10.5C22.5 11.8 19.8 11.4 18 10.5Z" fill="#7FD17A" stroke="#538D4E" strokeWidth="1.8" />
          <path
            d="M18 11.5C12.5 10.5 8.5 15 9.5 21C10.5 26.5 15 29.5 18 30.5C21 29.5 25.5 26.5 26.5 21C27.5 15 23.5 10.5 18 11.5Z"
            fill="#FFB69E"
            stroke="#A86B59"
            strokeWidth="2.2"
          />
          <path d="M18 12C16.5 16.5 17 22 18 29.5" stroke="#FF8D8A" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case 'sprout':
      return (
        <svg viewBox="0 0 36 36" className={cls} fill="none" aria-hidden="true">
          <path d="M18 30V17" stroke="#538D4E" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M18 18C11 18 7 12 10 9C14 8 18 12 18 18Z" fill="#92DF83" stroke="#538D4E" strokeWidth="2" strokeLinejoin="round" />
          <path d="M18 19C25 19 29 13 26 10C22 9 18 13 18 19Z" fill="#B2ED9C" stroke="#538D4E" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case 'kibble':
      return (
        <svg viewBox="0 0 36 36" className={cls} fill="none" aria-hidden="true">
          <circle cx="14" cy="16" r="2.6" fill="#C98A54" stroke="#8E5F39" strokeWidth="1.6" />
          <circle cx="19" cy="14.5" r="2.8" fill="#D99B62" stroke="#8E5F39" strokeWidth="1.6" />
          <circle cx="23" cy="16.5" r="2.4" fill="#C98A54" stroke="#8E5F39" strokeWidth="1.6" />
          <path
            d="M6.5 18.5H29.5L26.5 27.5C26 28.8 24.8 29.5 23.2 29.5H12.8C11.2 29.5 10 28.8 9.5 27.5L6.5 18.5Z"
            fill="#9EDDFF"
            stroke="#6C8DA3"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

export const BasketMiniIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg viewBox="0 0 28 28" className={`shrink-0 ${className}`} fill="none" aria-hidden="true">
    <path d="M9 12L12.5 5.5M19 12L15.5 5.5" stroke="#9E7352" strokeWidth="2.2" strokeLinecap="round" />
    <path
      d="M4.5 12H23.5L21 22.5C20.6 23.8 19.6 24.5 18.2 24.5H9.8C8.4 24.5 7.4 23.8 7 22.5L4.5 12Z"
      fill="#F7D59C"
      stroke="#9E7352"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path d="M10.5 15.5V21M14 15.5V21M17.5 15.5V21" stroke="#C99652" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const FlameMiniIcon: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5',
}) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" aria-hidden="true">
    <path
      d="M12.5 2.5C15 6 19 8.8 19 14C19 18 15.8 21 12 21C8.2 21 5 18 5 14C5 11.2 6.8 9 8.5 7.5C8.5 9.5 9.6 10.6 10.4 10.8C10 7.6 11.2 4.5 12.5 2.5Z"
      fill="#FF9852"
      stroke="#A8572A"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <path
      d="M12 12.5C13.5 14 14.8 15.3 14.8 17C14.8 18.6 13.5 19.8 12 19.8C10.5 19.8 9.2 18.6 9.2 17C9.2 15.5 10.4 14 12 12.5Z"
      fill="#FFE07D"
    />
  </svg>
);

export const ShieldMiniIcon: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5',
}) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" aria-hidden="true">
    <path
      d="M12 3L19.5 6V11.8C19.5 16.5 16.2 19.8 12 21.3C7.8 19.8 4.5 16.5 4.5 11.8V6L12 3Z"
      fill="#9EDDFF"
      stroke="#5C85A6"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M9.2 12.2L11.2 14.2L15.2 9.8" stroke="#FFFDF9" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TrophyMiniIcon: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5',
}) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" aria-hidden="true">
    <path d="M7 5H17V10C17 13 14.8 15.2 12 15.2C9.2 15.2 7 13 7 10V5Z" fill="#FFE07D" stroke="#A67C46" strokeWidth="2" strokeLinejoin="round" />
    <path d="M7 7H4.5C4.5 10.2 5.6 11.5 7 11.5M17 7H19.5C19.5 10.2 18.4 11.5 17 11.5" stroke="#A67C46" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M12 15.2V19M8.5 19.5H15.5" stroke="#A67C46" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
