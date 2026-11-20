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
    <ellipse cx="70" cy="109" rx="52" ry="9" fill="#89CC76" opacity="0.35" />
    {/* Pastel Peach Chimney + Rising Heart Puff */}
    <rect x="92" y="18" width="15" height="24" rx="4" fill="#FFC8C0" stroke="#A6826E" strokeWidth="2.6" />
    <rect x="89" y="15" width="21" height="6.5" rx="3" fill="#FF9E94" stroke="#A6826E" strokeWidth="2.5" />
    <g className="animate-chimney-puff">
      <path
        d="M99.5 11.5C98.2 9.4 95 9.6 95 11.8C95 13.7 99.5 15.8 99.5 15.8C99.5 15.8 104 13.7 104 11.8C104 9.6 100.8 9.4 99.5 11.5Z"
        fill="#FFB3CC"
        opacity="0.92"
      />
      <circle cx="105.5" cy="6.5" r="2.6" fill="#FFFDF9" opacity="0.9" />
    </g>
    {/* Cream Cottage Body */}
    <rect x="24" y="54" width="92" height="53" rx="13" fill="#FFFDF9" stroke="#A6826E" strokeWidth="2.6" />
    <rect x="27" y="96" width="86" height="8.5" rx="4.2" fill="#FCEBF1" />
    {/* Pastel Strawberry Coral Roof + Scallop Trim */}
    <path
      d="M12 58L70 17L128 58C131 60 129 66 125 66H15C11 66 9 60 12 58Z"
      fill="#FF9AA2"
      stroke="#A6826E"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <path d="M40 38L30 64M70 19V64M100 38L110 64" stroke="#F47C88" strokeWidth="2" strokeLinecap="round" />
    {/* Cute Pastel Scalloped Eaves */}
    {[24, 38, 52, 66, 80, 94, 108, 118].map((cx) => (
      <circle key={cx} cx={cx} cy="65.5" r="4.2" fill="#FFFDF9" stroke="#A6826E" strokeWidth="1.7" />
    ))}
    {/* Pastel Sky Round Window with Highlight */}
    <circle cx="70" cy="43" r="9.2" fill="#BBE6FF" stroke="#A6826E" strokeWidth="2.4" />
    <path d="M65.5 39C66.5 37.5 68 37 69.5 37.2" stroke="#FFFDF9" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M70 34V52M61 43H79" stroke="#A6826E" strokeWidth="2" />
    {/* Soft Honey Door with Heart Cutout */}
    <path
      d="M57 107V80C57 72 62.5 67 70 67C77.5 67 83 72 83 80V107H57Z"
      fill="#F7CF9C"
      stroke="#A6826E"
      strokeWidth="2.6"
    />
    <path
      d="M70 76.2C68.9 74.6 66.2 74.9 66.2 76.8C66.2 78.6 70 80.5 70 80.5C70 80.5 73.8 78.6 73.8 76.8C73.8 74.9 71.1 74.6 70 76.2Z"
      fill="#FF9AA2"
    />
    <circle cx="77" cy="90" r="2.2" fill="#FFE07D" stroke="#A6826E" strokeWidth="1.4" />
    {/* Windows + Pastel Flower Boxes */}
    <rect x="33" y="72" width="16" height="16" rx="5.5" fill="#BBE6FF" stroke="#A6826E" strokeWidth="2.3" />
    <rect x="91" y="72" width="16" height="16" rx="5.5" fill="#BBE6FF" stroke="#A6826E" strokeWidth="2.3" />
    <path d="M36 76.5H40M94 76.5H98" stroke="#FFFDF9" strokeWidth="1.7" strokeLinecap="round" />
    <rect x="30" y="88" width="22" height="6.5" rx="3" fill="#B8EBD0" stroke="#A6826E" strokeWidth="2" />
    <circle cx="36" cy="86" r="3" fill="#FF9AA2" />
    <circle cx="42" cy="85" r="3" fill="#FFE07D" />
    <circle cx="47" cy="86" r="3" fill="#FFFDF9" />
    <rect x="88" y="88" width="22" height="6.5" rx="3" fill="#B8EBD0" stroke="#A6826E" strokeWidth="2" />
    <circle cx="94" cy="86" r="3" fill="#FFE07D" />
    <circle cx="100" cy="85" r="3" fill="#FF9AA2" />
    <circle cx="105" cy="86" r="3" fill="#FFFDF9" />
  </svg>
);

export const CosmeticStallIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 130 112" className={className} fill="none" aria-hidden="true">
    <ellipse cx="65" cy="100" rx="46" ry="8" fill="#89CC76" opacity="0.35" />
    {/* Pastel Cream Posts */}
    <rect x="22" y="42" width="9.5" height="54" rx="4" fill="#F9DEC4" stroke="#A6826E" strokeWidth="2.6" />
    <rect x="98" y="42" width="9.5" height="54" rx="4" fill="#F9DEC4" stroke="#A6826E" strokeWidth="2.6" />
    {/* Pastel Mint Counter with Cozy Heart Emblem */}
    <rect x="16" y="68" width="98" height="30" rx="10" fill="#C9F2D9" stroke="#A6826E" strokeWidth="2.6" />
    <rect x="12" y="62" width="106" height="9" rx="4.5" fill="#FFFDF9" stroke="#A6826E" strokeWidth="2.6" />
    <rect x="46" y="75" width="38" height="16" rx="8" fill="#FFFDF9" stroke="#9EC9AE" strokeWidth="1.8" />
    <path
      d="M65 81.5C63.8 79.8 61 80.1 61 82C61 83.9 65 86 65 86C65 86 69 83.9 69 82C69 80.1 66.2 79.8 65 81.5Z"
      fill="#FF9AC2"
    />
    {/* Display Props */}
    <circle cx="42" cy="54" r="8.5" fill="#FFE07D" stroke="#A6826E" strokeWidth="2.2" />
    <ellipse cx="42" cy="59" rx="13" ry="3.8" fill="#FFF0AE" stroke="#A6826E" strokeWidth="2.2" />
    <path d="M64 56C64 51 68 48 73 48C78 48 82 51 82 56V62H64V56Z" fill="#FFB3D1" stroke="#A6826E" strokeWidth="2.2" />
    <circle cx="94" cy="56" r="5.5" fill="#A6E1FF" stroke="#A6826E" strokeWidth="2.2" />
    {/* Cute Tiny Pastel Bunting Flags */}
    <path d="M31 50Q65 56 99 50" stroke="#C8A994" strokeWidth="1.4" />
    <polygon points="44,52 50,53 47,58" fill="#FFE07D" />
    <polygon points="62,53 68,53 65,59" fill="#FF9AC2" />
    <polygon points="80,52 86,51 83,57" fill="#A6E1FF" />
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
        {accessory === 'ribbon-bow' && (
          <g transform="translate(0, -3)">
            <path d="M40 19L29 13V23L40 19Z" fill="#FF9AC2" stroke="#9B755D" strokeWidth="1.9" strokeLinejoin="round" />
            <path d="M40 19L51 13V23L40 19Z" fill="#FF9AC2" stroke="#9B755D" strokeWidth="1.9" strokeLinejoin="round" />
            <circle cx="40" cy="19" r="3.2" fill="#FFD1E4" stroke="#9B755D" strokeWidth="1.8" />
          </g>
        )}
        {accessory === 'flower-crown' && (
          <g transform="translate(0, -2)">
            <circle cx="30" cy="20" r="4" fill="#FFA6C9" stroke="#9B755D" strokeWidth="1.8" />
            <circle cx="40" cy="18" r="4.5" fill="#FFE07D" stroke="#9B755D" strokeWidth="1.8" />
            <circle cx="50" cy="20" r="4" fill="#8ED8FF" stroke="#9B755D" strokeWidth="1.8" />
          </g>
        )}
        {accessory === 'sunny-cap' && (
          <g transform="translate(0, -3)">
            <path d="M26 20C27 11 53 11 54 20Z" fill="#8ED8FF" stroke="#9B755D" strokeWidth="2.1" />
            <path d="M44 20H60C59 23 52 24 44 22Z" fill="#6BBFE8" stroke="#9B755D" strokeWidth="2" />
          </g>
        )}
        {accessory === 'top-hat' && (
          <g transform="translate(0, -5)">
            <ellipse cx="40" cy="21" rx="15" ry="3.6" fill="#5E4D58" stroke="#4B3C46" strokeWidth="2" />
            <rect x="30" y="7" width="20" height="14" rx="3" fill="#6D5A66" stroke="#4B3C46" strokeWidth="2" />
            <path d="M30 17H50" stroke="#FFE07D" strokeWidth="2.6" />
          </g>
        )}
        {accessory === 'royal-crown' && (
          <g transform="translate(0, -4)">
            <path d="M27 21L29 10L36 16L40 8L44 16L51 10L53 21Z" fill="#FFE07D" stroke="#9B755D" strokeWidth="2.1" strokeLinejoin="round" />
            <circle cx="40" cy="17" r="2.2" fill="#FF85A1" />
          </g>
        )}
      </g>
    </svg>
  );
};
