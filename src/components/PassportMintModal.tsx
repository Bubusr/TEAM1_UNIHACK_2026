import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  FileJson,
  Loader2,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import {
  Eip712MintAuthorization,
  IpfsPassportMetadata,
  MintedPassportRecord,
  SanctuaryPet,
  WalletState,
} from '../types';
import { CroppedPetCutout } from './CroppedPetCutout';
import { CrystalMintIcon } from './HandDrawnAssets';
import {
  PASSPORT_BOND_XP_THRESHOLD,
  PASSPORT_CONTRACT_ADDRESS,
  requestEip712MintSignature,
  shortenAddress,
  submitPassportMintTransaction,
  uploadPassportIpfsMetadata,
} from '../services/pawsApi';

type MintStage =
  | 'idle'
  | 'uploading_ipfs'
  | 'signing_eip712'
  | 'submitting_tx'
  | 'confirmed'
  | 'error';

interface PassportMintModalProps {
  open: boolean;
  pets: SanctuaryPet[];
  initialPetId: string | null;
  wallet: WalletState;
  nextTokenNumber: number;
  existingPassports: MintedPassportRecord[];
  onClose: () => void;
  onOpenWallet: () => void;
  onOpenQuest: () => void;
  onPassportMinted: (record: MintedPassportRecord) => void;
  onOpenGallery: () => void;
}

export const PassportMintModal: React.FC<PassportMintModalProps> = ({
  open,
  pets,
  initialPetId,
  wallet,
  nextTokenNumber,
  existingPassports,
  onClose,
  onOpenWallet,
  onOpenQuest,
  onPassportMinted,
  onOpenGallery,
}) => {
  const [selectedPetId, setSelectedPetId] = useState<string>(
    initialPetId ?? pets[0]?.id ?? ''
  );
  const [stage, setStage] = useState<MintStage>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ipfsMeta, setIpfsMeta] = useState<IpfsPassportMetadata | null>(null);
  const [eip712Auth, setEip712Auth] = useState<Eip712MintAuthorization | null>(
    null
  );
  const [confirmedRecord, setConfirmedRecord] =
    useState<MintedPassportRecord | null>(null);
  const [showMetadataPreview, setShowMetadataPreview] = useState(false);

  useEffect(() => {
    if (!open) return;
    const targetId =
      initialPetId && pets.some((p) => p.id === initialPetId)
        ? initialPetId
        : pets[0]?.id ?? '';
    setSelectedPetId(targetId);
    setStage('idle');
    setErrorMsg(null);
    setIpfsMeta(null);
    setEip712Auth(null);
    setConfirmedRecord(null);
    setShowMetadataPreview(false);
  }, [open, initialPetId, pets]);

  if (!open) return null;

  const pet = pets.find((p) => p.id === selectedPetId) ?? pets[0] ?? null;
  if (!pet) return null;

  const existingRecord =
    confirmedRecord ??
    existingPassports.find((r) => r.petId === pet.id) ??
    null;

  const petBondXp = pet.bondXp ?? 0;
  const bondReady = petBondXp >= PASSPORT_BOND_XP_THRESHOLD;
  const walletReady = wallet.connected && wallet.isAvalancheFuji;
  const canMint = bondReady && walletReady && !pet.minted && stage === 'idle';

  const handleStartMint = async () => {
    if (!pet || !wallet.address) return;
    setErrorMsg(null);
    try {
      setStage('uploading_ipfs');
      const meta = await uploadPassportIpfsMetadata(pet);
      setIpfsMeta(meta);

      setStage('signing_eip712');
      const auth = await requestEip712MintSignature(
        pet.id,
        wallet.address,
        meta.tokenUri
      );
      setEip712Auth(auth);

      setStage('submitting_tx');
      const record = await submitPassportMintTransaction({
        pet,
        metadata: meta,
        auth,
        providerLabel: wallet.providerLabel,
        nextTokenNumber,
      });

      setConfirmedRecord(record);
      setStage('confirmed');
      onPassportMinted(record);
    } catch (err) {
      setStage('error');
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Mint transaction failed on Avalanche Fuji.'
      );
    }
  };

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-[#4B3C46]/25 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 pb-7 sm:pb-3"
      role="dialog"
      aria-modal="true"
      aria-label="Mint Pet Passport NFT"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cream-card w-full max-w-[368px] max-h-[88%] flex flex-col overflow-hidden"
      >
        <div className="pt-2 pb-0.5 flex justify-center bg-[#FFFDF9] sm:hidden">
          <span className="w-10 h-1 rounded-full bg-[#E5D3CA]" />
        </div>
        <div className="px-4 py-2.5 border-b border-[#F2E6DC] flex items-center justify-between bg-[#FFFDF9]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#DFF3FF] border border-[#B3D5E8] flex items-center justify-center">
              <CrystalMintIcon className="w-4 h-4" />
            </div>
            <h3 className="font-display text-[15.5px] font-extrabold text-[#4B3C46]">
              Preserve Pet Passport
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Mint Modal"
            className="w-9 h-9 rounded-full bg-[#FFF5F8] border border-[#E5D3CA] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-3.5 overflow-y-auto flex-1 space-y-2.5 bg-[#FFFDF9]">
          {/* Pet Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {pets.map((p) => {
              const active = p.id === pet.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={stage !== 'idle' && stage !== 'confirmed' && stage !== 'error'}
                  onClick={() => {
                    setSelectedPetId(p.id);
                    setStage('idle');
                    setErrorMsg(null);
                    setConfirmedRecord(null);
                  }}
                  className={`rounded-2xl px-2 py-1 border flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#FFE07D] border-[#C99D66]'
                      : 'bg-[#FFF9F2] border-[#EFE0D4]'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg overflow-hidden bg-[#E8F8EC]">
                    <CroppedPetCutout
                      photoUrl={p.photoUrl}
                      alt={p.name}
                      mode={p.cutoutMode ?? 'auto'}
                      className="w-6 h-6"
                    />
                  </div>
                  <span className="font-display text-[11.5px] font-extrabold text-[#4B3C46] whitespace-nowrap">
                    {p.name}
                    {p.minted ? ' ✓' : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Pet Summary Card */}
          <div className="bg-gradient-to-br from-[#F0F8FF] to-[#FFFDF9] border border-[#C6E1F5] rounded-2xl p-2.5 flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#E8F8EC] border border-[#CFEBD5] flex items-center justify-center shrink-0 overflow-hidden">
              <CroppedPetCutout
                photoUrl={pet.photoUrl}
                alt={pet.name}
                mode={pet.cutoutMode ?? 'auto'}
                accessory={pet.accessory}
                hatTransform={pet.hatTransform}
                className="w-14 h-14"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="font-display text-[15px] font-extrabold text-[#4B3C46] truncate">
                  {pet.name}
                </span>
                <span className="text-[11px] font-extrabold text-[#4F7EA6] tabular-nums shrink-0">
                  Bond Lv.{pet.bondLevel}
                </span>
              </div>
              <div className="text-[11px] font-bold text-[#8A747E] capitalize">
                {pet.species} · {pet.discoveryDate}
              </div>
              <div className="text-[10.5px] font-mono text-[#8A747E] truncate">
                ID: {pet.id}
              </div>
            </div>
          </div>

          {/* Eligibility Gate Checklist */}
          {!existingRecord && (
            <div className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-2.5 space-y-2">
              <div className="text-[11.5px] font-extrabold text-[#4B3C46]">
                Passport Eligibility Checklist
              </div>

              <div className="flex items-center justify-between text-[11.5px] font-bold">
                <span className="flex items-center gap-1.5 text-[#4B3C46]">
                  <CheckCircle2 className="w-4 h-4 text-[#4EA866]" />
                  <span>AI Verified &amp; Welcomed</span>
                </span>
                <span className="text-[#4EA866] font-extrabold">Ready</span>
              </div>

              <div className="flex items-center justify-between text-[11.5px] font-bold">
                <span className="flex items-center gap-1.5 text-[#4B3C46]">
                  {bondReady ? (
                    <CheckCircle2 className="w-4 h-4 text-[#4EA866]" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#C8B2A4]" />
                  )}
                  <span>
                    Bond XP ({pet.bondXp}/{PASSPORT_BOND_XP_THRESHOLD})
                  </span>
                </span>
                {!bondReady ? (
                  <button
                    type="button"
                    onClick={onOpenQuest}
                    className="text-[11px] font-extrabold text-[#A97B2B] underline cursor-pointer"
                  >
                    Complete Quest (+100 XP)
                  </button>
                ) : (
                  <span className="text-[#4EA866] font-extrabold">Eligible</span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11.5px] font-bold">
                <span className="flex items-center gap-1.5 text-[#4B3C46]">
                  {walletReady ? (
                    <CheckCircle2 className="w-4 h-4 text-[#4EA866]" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#C8B2A4]" />
                  )}
                  <span>
                    Core Wallet (Fuji){' '}
                    {wallet.connected ? `· ${shortenAddress(wallet.address)}` : ''}
                  </span>
                </span>
                {!walletReady ? (
                  <button
                    type="button"
                    onClick={onOpenWallet}
                    className="text-[11px] font-extrabold text-[#4F7EA6] underline cursor-pointer flex items-center gap-1"
                  >
                    <Wallet className="w-3 h-3" />
                    <span>{wallet.connected ? 'Switch Fuji' : 'Connect'}</span>
                  </button>
                ) : (
                  <span className="text-[#4EA866] font-extrabold">Connected</span>
                )}
              </div>
            </div>
          )}

          {/* Live Minting Pipeline Status */}
          {(stage !== 'idle' || existingRecord) && (
            <div className="bg-[#F6FBF7] border border-[#CFEBD5] rounded-2xl p-2.5 space-y-2">
              {[
                {
                  key: 'uploading_ipfs',
                  label: '1. Pin IPFS Metadata & Portrait',
                  done:
                    Boolean(ipfsMeta || existingRecord) &&
                    stage !== 'uploading_ipfs',
                  active: stage === 'uploading_ipfs',
                },
                {
                  key: 'signing_eip712',
                  label: '2. Generate EIP-712 Claim Signature',
                  done:
                    Boolean(eip712Auth || existingRecord) &&
                    stage !== 'signing_eip712',
                  active: stage === 'signing_eip712',
                },
                {
                  key: 'submitting_tx',
                  label: '3. Mint ERC-721 on Avalanche Fuji',
                  done: Boolean(existingRecord) && stage !== 'submitting_tx',
                  active: stage === 'submitting_tx',
                },
              ].map((step) => (
                <div
                  key={step.key}
                  className="flex items-center justify-between text-[11.5px] font-bold text-[#4B3C46]"
                >
                  <span className="flex items-center gap-1.5">
                    {step.active ? (
                      <Loader2 className="w-4 h-4 text-[#4F7EA6] animate-spin" />
                    ) : step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-[#4EA866]" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#C8B2A4]" />
                    )}
                    <span>{step.label}</span>
                  </span>
                  <span className="text-[10.5px] text-[#8A747E]">
                    {step.active ? 'Running...' : step.done ? 'Done' : 'Waiting'}
                  </span>
                </div>
              ))}

              {(ipfsMeta || existingRecord) && (
                <button
                  type="button"
                  onClick={() => setShowMetadataPreview((v) => !v)}
                  className="w-full pt-1 border-t border-[#DFECE2] flex items-center justify-between text-[11px] font-extrabold text-[#4F7EA6] cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <FileJson className="w-3.5 h-3.5" />
                    <span>IPFS &amp; EIP-712 Proof</span>
                  </span>
                  <span>{showMetadataPreview ? 'Hide' : 'Inspect'}</span>
                </button>
              )}

              {showMetadataPreview && (
                <div className="bg-[#FFFDF9] border border-[#DFECE2] rounded-xl p-2 text-[10px] font-mono text-[#4B3C46] space-y-1 break-all">
                  <div>
                    <strong>Contract:</strong> {PASSPORT_CONTRACT_ADDRESS}
                  </div>
                  <div>
                    <strong>Token URI:</strong>{' '}
                    {ipfsMeta?.tokenUri ?? existingRecord?.ipfsUri}
                  </div>
                  {eip712Auth && (
                    <div>
                      <strong>EIP-712 Sig:</strong>{' '}
                      {eip712Auth.signature.slice(0, 28)}...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="bg-[#FFEAF0] border border-[#E6B8C5] rounded-2xl p-2.5 text-[11.5px] font-bold text-[#9B3B52] flex items-center justify-between gap-2">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setStage('idle')}
                className="underline shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Confirmed Result Card OR Primary Mint CTA */}
          {existingRecord ? (
            <div className="space-y-2">
              <div className="bg-[#FFF3BF] border border-[#E0BE63] rounded-2xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#4EA866]" />
                  <div>
                    <div className="font-display text-[13px] font-extrabold text-[#4B3C46]">
                      Passport {existingRecord.tokenId} Confirmed!
                    </div>
                    <div className="text-[10.5px] font-mono text-[#7B6670]">
                      TX {shortenAddress(existingRecord.txHash)}
                    </div>
                  </div>
                </div>
                <a
                  href={existingRecord.snowtraceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#FFFDF9] border border-[#D9C3B4] rounded-full px-2.5 py-1 text-[11px] font-extrabold text-[#4F7EA6] flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Snowtrace</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGallery();
                }}
                className="buttercup-cta w-full rounded-full py-2.5 px-4 font-display text-[13.5px] font-extrabold text-[#4B3C46] cursor-pointer"
              >
                View in Public Passport Gallery
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!canMint}
              onClick={handleStartMint}
              className="buttercup-cta w-full rounded-full py-2.5 px-4 font-display text-[14px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {stage !== 'idle' && stage !== 'error' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Minting on Avalanche Fuji...</span>
                </>
              ) : (
                <>
                  <CrystalMintIcon className="w-4 h-4" />
                  <span>
                    {!bondReady
                      ? `Need ${PASSPORT_BOND_XP_THRESHOLD - (pet.bondXp ?? 0)} More Bond XP`
                      : !walletReady
                      ? 'Connect Core Wallet First'
                      : `Mint ${pet.name} Passport (ERC-721)`}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
