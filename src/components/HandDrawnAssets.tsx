import React from 'react';
import { PetSpecies } from '../types';

export const PawCoinIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="16.5" fill="#FFE07D" stroke="#B88B61" strokeWidth="2.6" />
    <circle cx="20" cy="20" r="12.5" fill="#FFF0AE" stroke="#F5C34B" strokeWidth="1.4" />
    <ellipse cx="20" cy="24" rx="5.2" ry="4" fill="#9E7352" />
    <circle cx="13.8" cy="17.8" r="2.2" fill="#9E7352" />
    <circle cx="17.9" cy="14.8" r="2.2" fill="#9E7352" />
    <circle cx="22.4" cy="14.8" r="2.2" fill="#9E7352" />
    <circle cx="26.2" cy="17.8" r="2.2" fill="#9E7352" />
  </svg>
);

export const LightningEnergyIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
    <path
      d="M23 5L11 22H19.5L17 35L29 18H20.5L23 5Z"
      fill="#FFE07D"
      stroke="#B88B61"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const CrystalMintIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 28 28" className={className} fill="none" aria-hidden="true">
    <polygon
      points="14,3 24,14 14,25 4,14"
      fill="#8ED8FF"
      stroke="#968191"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <polygon points="14,3 19,14 14,25 9,14" fill="#C4ECFF" opacity="0.85" />
  </svg>
);

export const FarmhouseIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 140 120" className={className} fill="none" aria-hidden="true">
    <ellipse cx="70" cy="108" rx="50" ry="9" fill="#89CC76" opacity="0.35" />
    {/* Pastel Peach Chimney */}
    <rect x="92" y="16" width="15" height="24" rx="4" fill="#FFC8C0" stroke="#A6826E" strokeWidth="2.6" />
    <rect x="89" y="13" width="21" height="6.5" rx="3" fill="#FF9E94" stroke="#A6826E" strokeWidth="2.5" />
    <circle cx="100" cy="6" r="3" fill="#FFFDF9" opacity="0.9" />
    {/* Cream Cottage Body */}
    <rect x="24" y="54" width="92" height="52" rx="12" fill="#FFFDF9" stroke="#A6826E" strokeWidth="2.6" />
    <rect x="27" y="96" width="86" height="8" rx="4" fill="#FCEBF1" />
    {/* Pastel Strawberry Coral Roof */}
    <path
      d="M12 58L70 17L128 58C131 60 129 66 125 66H15C11 66 9 60 12 58Z"
      fill="#FF9AA2"
      stroke="#A6826E"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <path d="M40 38L30 64M70 19V64M100 38L110 64" stroke="#F47C88" strokeWidth="2" strokeLinecap="round" />
    {/* Pastel Sky Round Window */}
    <circle cx="70" cy="43" r="9" fill="#BBE6FF" stroke="#A6826E" strokeWidth="2.4" />
    <path d="M70 34V52M61 43H79" stroke="#A6826E" strokeWidth="2" />
    {/* Soft Honey Door */}
    <path
      d="M57 106V80C57 72 62.5 67 70 67C77.5 67 83 72 83 80V106H57Z"
      fill="#F7CF9C"
      stroke="#A6826E"
      strokeWidth="2.6"
    />
    <circle cx="77" cy="89" r="2.2" fill="#FFE07D" stroke="#A6826E" strokeWidth="1.4" />
    {/* Windows + Pastel Flower Boxes */}
    <rect x="33" y="72" width="16" height="16" rx="5" fill="#BBE6FF" stroke="#A6826E" strokeWidth="2.3" />
    <rect x="91" y="72" width="16" height="16" rx="5" fill="#BBE6FF" stroke="#A6826E" strokeWidth="2.3" />
    <rect x="30" y="88" width="22" height="6.5" rx="3" fill="#B8EBD0" stroke="#A6826E" strokeWidth="2" />
    <circle cx="36" cy="86" r="2.8" fill="#FF9AA2" />
    <circle cx="42" cy="85" r="2.8" fill="#FFE07D" />
    <circle cx="47" cy="86" r="2.8" fill="#FFFDF9" />
    <rect x="88" y="88" width="22" height="6.5" rx="3" fill="#B8EBD0" stroke="#A6826E" strokeWidth="2" />
    <circle cx="94" cy="86" r="2.8" fill="#FFE07D" />
    <circle cx="100" cy="85" r="2.8" fill="#FF9AA2" />
    <circle cx="105" cy="86" r="2.8" fill="#FFFDF9" />
  </svg>
);

export const CosmeticStallIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 130 112" className={className} fill="none" aria-hidden="true">
    <ellipse cx="65" cy="100" rx="46" ry="8" fill="#89CC76" opacity="0.35" />
    {/* Pastel Cream Posts */}
    <rect x="22" y="42" width="9.5" height="54" rx="4" fill="#F9DEC4" stroke="#A6826E" strokeWidth="2.6" />
    <rect x="98" y="42" width="9.5" height="54" rx="4" fill="#F9DEC4" stroke="#A6826E" strokeWidth="2.6" />
    {/* Pastel Mint Counter */}
    <rect x="16" y="68" width="98" height="30" rx="10" fill="#C9F2D9" stroke="#A6826E" strokeWidth="2.6" />
    <rect x="12" y="62" width="106" height="9" rx="4.5" fill="#FFFDF9" stroke="#A6826E" strokeWidth="2.6" />
    {/* Display Props */}
    <circle cx="42" cy="54" r="8.5" fill="#FFE07D" stroke="#A6826E" strokeWidth="2.2" />
    <ellipse cx="42" cy="59" rx="13" ry="3.8" fill="#FFF0AE" stroke="#A6826E" strokeWidth="2.2" />
    <path d="M64 56C64 51 68 48 73 48C78 48 82 51 82 56V62H64V56Z" fill="#FFB3D1" stroke="#A6826E" strokeWidth="2.2" />
    <circle cx="94" cy="56" r="5.5" fill="#A6E1FF" stroke="#A6826E" strokeWidth="2.2" />
    {/* Pastel Pink & Cream Striped Awning */}
    <path
      d="M12 42L24 16H106L118 42H12Z"
      fill="#FFFDF9"
      stroke="#A6826E"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <path d="M24 16L18 42H36L40 16H24Z" fill="#FFA6B8" />
    <path d="M56 16L54 42H76L74 16H56Z" fill="#FFA6B8" />
    <path d="M90 16L94 42H112L106 16H90Z" fill="#FFA6B8" />
    {[21, 39, 57, 75, 93, 109].map((cx, i) => (
      <circle
        key={cx}
        cx={cx}
        cy="43"
        r="8.8"
        fill={i % 2 === 0 ? '#FFA6B8' : '#FFFDF9'}
        stroke="#A6826E"
        strokeWidth="2.4"
      />
    ))}
    <path d="M12 42L24 16H106L118 42" stroke="#A6826E" strokeWidth="2.6" strokeLinejoin="round" />
  </svg>
);

export const ChibiPetSprite: React.FC<{
  species: PetSpecies;
  accessory?: string | null;
  flip?: boolean;
  className?: string;
}> = ({ species, accessory, flip = false, className = 'w-16 h-16' }) => {
  const transform = flip ? 'scale(-1, 1)' : undefined;

  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" aria-hidden="true">
      <g transform={transform} style={{ transformOrigin: '40px 40px' }}>
        <ellipse cx="40" cy="68" rx="21" ry="5.5" fill="#7AC768" opacity="0.32" />

        {species === 'cat' && (
          <>
            <path d="M56 54C66 52 70 42 64 36" stroke="#9B755D" strokeWidth="7" strokeLinecap="round" />
            <path d="M56 54C66 52 70 42 64 36" stroke="#FFBC82" strokeWidth="3.6" strokeLinecap="round" />
            <ellipse cx="40" cy="52" rx="18" ry="15" fill="#FFFDF9" stroke="#9B755D" strokeWidth="2.6" />
            <ellipse cx="32" cy="54" rx="6" ry="5" fill="#FFBC82" />
            <path d="M22 30L19 14L33 22Z" fill="#FFBC82" stroke="#9B755D" strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M58 30L61 14L47 22Z" fill="#C49A7E" stroke="#9B755D" strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M23 26L21.5 18L29 22.5Z" fill="#FFC2D4" />
            <path d="M57 26L58.5 18L51 22.5Z" fill="#FFC2D4" />
            <ellipse cx="40" cy="34" rx="21" ry="17" fill="#FFFDF9" stroke="#9B755D" strokeWidth="2.6" />
            <path d="M22 28C26 22 33 22 35 28C32 33 24 33 22 28Z" fill="#FFBC82" />
            <path d="M46 21C53 21 58 26 57 31C52 31 46 27 46 21Z" fill="#C49A7E" />
            <circle cx="32" cy="35" r="2.5" fill="#4B3C46" />
            <circle cx="48" cy="35" r="2.5" fill="#4B3C46" />
            <circle cx="31" cy="34" r="0.9" fill="#FFFDF9" />
            <circle cx="47" cy="34" r="0.9" fill="#FFFDF9" />
            <ellipse cx="27" cy="39" rx="3" ry="1.8" fill="#FFB3C9" opacity="0.8" />
            <ellipse cx="53" cy="39" rx="3" ry="1.8" fill="#FFB3C9" opacity="0.8" />
            <path d="M36 39C37.5 41 39.5 41 40 39C40.5 41 42.5 41 44 39" stroke="#4B3C46" strokeWidth="2.1" strokeLinecap="round" />
            <ellipse cx="31" cy="64" rx="4.5" ry="3.3" fill="#FFFDF9" stroke="#9B755D" strokeWidth="2.2" />
            <ellipse cx="49" cy="64" rx="4.5" ry="3.3" fill="#FFFDF9" stroke="#9B755D" strokeWidth="2.2" />
          </>
        )}

        {species === 'dog' && (
          <>
            <path d="M57 52C67 48 70 38 64 34" stroke="#9B755D" strokeWidth="7" strokeLinecap="round" />
            <path d="M57 52C67 48 70 38 64 34" stroke="#FFE094" strokeWidth="3.6" strokeLinecap="round" />
            <ellipse cx="40" cy="52" rx="19" ry="15" fill="#FFE094" stroke="#9B755D" strokeWidth="2.6" />
            <ellipse cx="40" cy="54" rx="10" ry="9" fill="#FFF8E2" />
            <ellipse cx="40" cy="33" rx="20" ry="17" fill="#FFE094" stroke="#9B755D" strokeWidth="2.6" />
            <ellipse cx="19" cy="35" rx="6" ry="11" transform="rotate(14 19 35)" fill="#F3C46D" stroke="#9B755D" strokeWidth="2.6" />
            <ellipse cx="61" cy="35" rx="6" ry="11" transform="rotate(-14 61 35)" fill="#F3C46D" stroke="#9B755D" strokeWidth="2.6" />
            <ellipse cx="40" cy="38" rx="9" ry="6.5" fill="#FFF9E8" />
            <ellipse cx="40" cy="35.5" rx="3.2" ry="2.2" fill="#4B3C46" />
            <circle cx="32" cy="31" r="2.6" fill="#4B3C46" />
            <circle cx="48" cy="31" r="2.6" fill="#4B3C46" />
            <circle cx="31" cy="30" r="1" fill="#FFFDF9" />
            <circle cx="47" cy="30" r="1" fill="#FFFDF9" />
            <path d="M38 41C38 44 42 44 42 41Z" fill="#FF9EC4" stroke="#9B755D" strokeWidth="1.4" />
            <ellipse cx="30" cy="64" rx="4.6" ry="3.3" fill="#FFE094" stroke="#9B755D" strokeWidth="2.2" />
            <ellipse cx="50" cy="64" rx="4.6" ry="3.3" fill="#FFE094" stroke="#9B755D" strokeWidth="2.2" />
          </>
        )}

        {species === 'bunny' && (
          <>
            <circle cx="57" cy="56" r="6" fill="#FFFDF9" stroke="#9B755D" strokeWidth="2.5" />
            <ellipse cx="40" cy="53" rx="16" ry="14" fill="#FFFDF9" stroke="#9B755D" strokeWidth="2.6" />
            <ellipse cx="31" cy="17" rx="5.5" ry="13" transform="rotate(-10 31 17)" fill="#FFFDF9" stroke="#9B755D" strokeWidth="2.6" />
            <ellipse cx="49" cy="17" rx="5.5" ry="13" transform="rotate(10 49 17)" fill="#FFFDF9" stroke="#9B755D" strokeWidth="2.6" />
            <ellipse cx="31" cy="18" rx="2.5" ry="8" transform="rotate(-10 31 18)" fill="#FFC5D8" />
            <ellipse cx="49" cy="18" rx="2.5" ry="8" transform="rotate(10 49 18)" fill="#FFC5D8" />
            <ellipse cx="40" cy="36" rx="19" ry="15" fill="#FFFDF9" stroke="#9B755D" strokeWidth="2.6" />
            <circle cx="33" cy="36" r="2.4" fill="#4B3C46" />
            <circle cx="47" cy="36" r="2.4" fill="#4B3C46" />
            <circle cx="32.2" cy="35" r="0.9" fill="#FFFDF9" />
            <circle cx="46.2" cy="35" r="0.9" fill="#FFFDF9" />
            <ellipse cx="27" cy="40" rx="3" ry="1.8" fill="#FFC5D8" />
            <ellipse cx="53" cy="40" rx="3" ry="1.8" fill="#FFC5D8" />
            <ellipse cx="40" cy="38.5" rx="2.2" ry="1.5" fill="#FF94BA" />
            <path d="M37 41C38.5 42.5 39.5 42.5 40 41C40.5 42.5 41.5 42.5 43 41" stroke="#4B3C46" strokeWidth="1.9" strokeLinecap="round" />
            <ellipse cx="32" cy="64" rx="4.4" ry="3.1" fill="#FFFDF9" stroke="#9B755D" strokeWidth="2.2" />
            <ellipse cx="48" cy="64" rx="4.4" ry="3.1" fill="#FFFDF9" stroke="#9B755D" strokeWidth="2.2" />
          </>
        )}

        {species === 'corgi' && (
          <>
            <ellipse cx="40" cy="53" rx="19" ry="14" fill="#FFBA82" stroke="#9B755D" strokeWidth="2.6" />
            <ellipse cx="40" cy="55" rx="11" ry="9" fill="#FFFDF9" />
            <path d="M21 29L17 11L33 21Z" fill="#FFBA82" stroke="#9B755D" strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M59 29L63 11L47 21Z" fill="#FFBA82" stroke="#9B755D" strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M22 25L20 15L29 21Z" fill="#FFC5D8" />
            <path d="M58 25L60 15L51 21Z" fill="#FFC5D8" />
            <ellipse cx="40" cy="34" rx="20" ry="16" fill="#FFBA82" stroke="#9B755D" strokeWidth="2.6" />
            <path d="M35 20C38 19 42 19 45 20L43 35H37L35 20Z" fill="#FFFDF9" />
            <ellipse cx="40" cy="39" rx="11" ry="7" fill="#FFFDF9" />
            <circle cx="32" cy="32" r="2.5" fill="#4B3C46" />
            <circle cx="48" cy="32" r="2.5" fill="#4B3C46" />
            <ellipse cx="40" cy="36.5" rx="2.9" ry="2.1" fill="#4B3C46" />
            <path d="M37 41C38.5 43 41.5 43 43 41" stroke="#4B3C46" strokeWidth="1.9" strokeLinecap="round" />
            <ellipse cx="30" cy="64" rx="4.4" ry="3.1" fill="#FFFDF9" stroke="#9B755D" strokeWidth="2.2" />
            <ellipse cx="50" cy="64" rx="4.4" ry="3.1" fill="#FFFDF9" stroke="#9B755D" strokeWidth="2.2" />
          </>
        )}

        {accessory === 'straw-hat' && (
          <g transform="translate(0, -4)">
            <ellipse cx="40" cy="20" rx="17" ry="4.5" fill="#FFE07D" stroke="#9B755D" strokeWidth="2.2" />
            <path d="M30 20C30 12 50 12 50 20Z" fill="#FFF0AE" stroke="#9B755D" strokeWidth="2.2" />
            <path d="M31 18H49" stroke="#FF9AA2" strokeWidth="2.4" />
          </g>
        )}
        {accessory === 'flower-crown' && (
          <g transform="translate(0, -2)">
            <circle cx="30" cy="20" r="4" fill="#FFA6C9" stroke="#9B755D" strokeWidth="1.8" />
            <circle cx="40" cy="18" r="4.5" fill="#FFE07D" stroke="#9B755D" strokeWidth="1.8" />
            <circle cx="50" cy="20" r="4" fill="#8ED8FF" stroke="#9B755D" strokeWidth="1.8" />
          </g>
        )}
      </g>
    </svg>
  );
};
