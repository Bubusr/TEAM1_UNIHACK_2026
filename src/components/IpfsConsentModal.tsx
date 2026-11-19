import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, X, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { SanctuaryPet } from '../types';

export interface IpfsConsentModalProps {
  isOpen: boolean;
  pet: SanctuaryPet | null;
  isMinting: boolean;
  onConfirm: (consent: { accepted: boolean; consentVersion: string }) => void;
  onClose: () => void;
}

export const IpfsConsentModal: React.FC<IpfsConsentModalProps> = ({
  isOpen,
  pet,
  isMinting,
  onConfirm,
  onClose,
}) => {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen || !pet) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || isMinting) return;
    onConfirm({ accepted: true, consentVersion: '1.0' });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ipfs-consent-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#4B3C46]/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isMinting) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-[500px] bg-[#FFFDF9] border-[3px] border-[#DFCBBF] rounded-[32px] shadow-[0_16px_40px_rgba(75,60,70,0.22)] overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#F0E6DE]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EBF7EE] border border-[#BDE7C7] flex items-center justify-center text-[#2D6A4F]">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3
                id="ipfs-consent-title"
                className="font-display text-[16px] font-bold text-[#4B3C46]"
              >
                Public IPFS Consent
              </h3>
              <p className="text-[11px] text-[#8A747E]">
                Pet Passport On-Chain Minting (Fuji 43113)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isMinting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8A747E] hover:bg-[#F4ECE4] transition cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Pet Preview Banner */}
          <div className="flex items-center gap-3.5 bg-[#FAF4ED] border border-[#E8DDD2] p-3 rounded-2xl">
            {pet.photoUrl ? (
              <img
                src={pet.photoUrl}
                alt={pet.name}
                className="w-14 h-14 rounded-xl object-cover border border-[#DFD1C4] shadow-sm shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-[#E8DDD2] flex items-center justify-center text-xl shrink-0">
                🐾
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-[15px] font-bold text-[#4B3C46] truncate">
                  {pet.name}
                </span>
                <span className="text-[11px] bg-[#FFEBB2] border border-[#EAD08D] text-[#6B531E] px-2 py-0.5 rounded-full font-bold">
                  Score {pet.score ?? 80}
                </span>
              </div>
              <p className="text-[12px] text-[#8A747E] truncate">
                {pet.species} · Bond {pet.bondXp ?? 0} XP
              </p>
            </div>
          </div>

          {/* Warning / Disclosures Box */}
          <div className="bg-[#FFF9F2] border border-[#F5E2CE] rounded-2xl p-4 text-[12px] text-[#5C4D44] space-y-2.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-[#A85B24] text-[12.5px]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Decentralized Publication Disclosures</span>
            </div>
            <ul className="list-disc pl-4 space-y-1.5 text-[11.5px] text-[#69584F]">
              <li>
                <strong>Public IPFS Storage:</strong> Your pet's portrait will be uploaded to decentralized IPFS storage and becomes publicly discoverable.
              </li>
              <li>
                <strong>Public NFT Metadata:</strong> Pet name, species, score, and traits will be recorded immutably on the Avalanche Fuji blockchain.
              </li>
              <li>
                <strong>Decentralized Permanence:</strong> Content published to IPFS and smart contracts cannot be modified by game administrators.
              </li>
              <li>
                <strong>No Deletion Guarantee:</strong> Decentralized networks cannot guarantee complete removal even if your game account is deleted.
              </li>
            </ul>
          </div>

          {/* Interactive Checkbox */}
          <div
            onClick={() => !isMinting && setAgreed(!agreed)}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border transition cursor-pointer select-none ${
              agreed
                ? 'bg-[#F2FBF4] border-[#B2E6C2] text-[#245C38]'
                : 'bg-[#FFFDF9] border-[#DFD1C4] text-[#6E5C54] hover:bg-[#FAF4ED]'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {agreed ? (
                <CheckSquare className="w-5 h-5 text-[#2D6A4F]" />
              ) : (
                <Square className="w-5 h-5 text-[#B8A499]" />
              )}
            </div>
            <p className="text-[12px] leading-snug font-medium">
              I understand and explicitly consent to publishing this pet's portrait and metadata to public IPFS storage (Version 1.0).
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#F0E6DE] bg-[#FCF8F4]">
          <button
            type="button"
            onClick={onClose}
            disabled={isMinting}
            className="px-4 py-2 rounded-full border border-[#D9C8BC] text-[#69584F] text-[13px] font-bold hover:bg-[#F2E8DF] transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!agreed || isMinting}
            className="px-5 py-2 rounded-full bg-[#FFE07D] hover:bg-[#FFD752] border border-[#E6C665] text-[#4B3C46] text-[13px] font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5"
          >
            {isMinting ? 'Minting...' : 'Accept & Mint Passport'}
          </button>
        </div>
      </div>
    </div>
  );
};
