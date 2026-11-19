# **PAWS & PICKET — CLAUDE CODE INSTRUCTIONS & BLUEPRINT**

## SYSTEM ROLE & TASK CONTEXT

You are an expert full-stack Web3 game developer building Paws & Picket, a cozy pet discovery & sanctuary game combining AI and blockchain for the Team1 Vietnam UniHack.  
Core Stack: React (Frontend), Express/TypeScript (Backend), PostgreSQL (DB), Gemini AI (Image/Species Judge), IPFS (Metadata), Avalanche Fuji Testnet (ERC-721 Passports), Core Wallet.

## 1\. CORE CONCEPT & VALUE PROPOSITION

Concept: Cozy pet discovery & sanctuary game. Discover pets via real photos, nurture them in a sanctuary, and preserve their story on-chain.  
Value Layers:

* Emotional: Care for & bond with pets.  
* Gameplay: Discover, nurture, farm food, and interact.  
* Web3: Immutable Pet Passport NFT (ERC-721) on Avalanche Fuji preserving identity & ownership.

Key Rule: Blockchain is strictly for preserving user accomplishments and pet identity, not core game mechanics.

## 2\. PET JOURNEY (6 PHASES)

* 1\. DISCOVER: Upload/snap photo \-\> Gemini AI analyzes species, validity, and quality.  
* 2\. WELCOME: Valid pets added to Sanctuary \-\> Name pet and view initial profile.  
* 3\. CARE: Feed, Play, Pet \-\> Gain Bond XP and grow pet stats.  
* 4\. GROW: Expand Sanctuary, farm food, unlock items, visit neighbors.  
* 5\. PRESERVE: Reach eligibility requirements \-\> Generate authenticated Pet Passport.  
* 6\. CONNECT: Connect Core Wallet \-\> Mint ERC-721 on Avalanche Fuji \-\> Verify on Explorer.

## 3\. FEATURE SPECIFICATIONS & PRIORITIES

### P0 (Must Have for Hackathon MVP)

* AI Photo Judge: Image upload, Gemini AI validation, species classification.  
* Pet Discovery & Profile: Create pet record (Name, Species, Discovery Date, Bond Level, Status).  
* Sanctuary Garden: Main sanctuary screen rendering active pets.  
* Pet Care & Bond System: Feed/Play mechanics incrementing verified Bond XP on backend.  
* First Bond Quest (Tutorial): Complete Welcome \-\> Feed \-\> Play \-\> Claim 100 Bond XP.  
* Web3 Minting Engine: Core Wallet connection & address authentication, Backend eligibility check & EIP-712 signature generation, PawsAndPicketPassport.sol ERC-721 minting on Avalanche Fuji, IPFS metadata storage & Snowtrace explorer linking.

### P1 (High Priority / Supporting)

* Pet Animations: Idle, eating, playing states.  
* Farm & Inventory: Basic crop loop (Plant \-\> Grow \-\> Harvest \-\> Food Inventory \-\> Feed Pet).  
* Public Pet Passport Gallery: Community page showcasing minted NFTs with metadata and Explorer links.

### P2 / P3 (Expansion / Long-term)

* Sanctuary decorations, weather/day-night cycles, neighbor visits, pet gifting/adoption transfers, achievement badges (ERC-1155).

## 4\. SYSTEM ARCHITECTURE & SECURITY RULES

* Source of Truth: Backend (Express/PostgreSQL) strictly governs game logic, quest completion, and XP calculations.  
* Anti-Cheat: Frontend cannot grant XP or directly mutate eligibility. Quests must be validated server-side to prevent duplicate claims.  
* Web3 Security: Private keys MUST NEVER be stored on the backend. Backend acts as a Trusted Signer issuing EIP-712 claim signatures once criteria are met. Players execute and pay gas for mint transactions via Core Wallet.  
* Data Consistency: Unique petId persists across Discovery, Backend DB, IPFS Metadata, and Smart Contract.

## 5\. CODEBASE DOMAIN BOUNDARIES (3-MEMBER TEAM)

### Team Member Responsibilities

* Member 01: Game & Frontend. Key Files: src/components/\*, src/App.tsx, UI styling. Primary Responsibilities: UI/UX, Sanctuary views, Pet Journey flow, Mint modal, Passport Gallery, loading/error states.  
* Member 02: Backend & AI. Key Files: src/server/gameActions.ts, src/server/aiJudge.ts, Database schema. Primary Responsibilities: Express REST APIs, PostgreSQL migrations, Gemini integration, quest validation, IPFS metadata upload.  
* Member 03: Blockchain & Web3. Key Files: contracts/\*, src/server/web3Service.ts, src/server/walletAuth.ts. Primary Responsibilities: Solidity smart contract, EIP-712 claim signing, Core Wallet integration, Avalanche Fuji deployment & verification.

### Member 01: Game & Frontend \- Detailed Task Breakdown

* UI/UX Architecture: Design and implement sanctuary views, interactive pet elements, and responsive layout across mobile and desktop.  
* Pet Journey Flow: Build seamless step-by-step navigation for Discover, Welcome, Care, Grow, Preserve, and Connect phases.  
* Web3 Interface: Construct the Passport Mint modal, transaction status overlays, and Core Wallet connection state triggers.  
* Public Gallery: Implement filterable public gallery grid to display on-chain minted Pet Passports with live metadata and Snowtrace links.  
* Feedback & Polish: Add loading spinners, optimistic UI updates, error boundary fallback screens, and visual feedback for care actions.

### Member 02: Backend & AI \- Detailed Task Breakdown

* Express API & Server Infrastructure: Set up REST endpoints for pet management, care action processing, and quest validation.  
* Database Architecture: Design PostgreSQL schemas for users, pets, sanctuary items, and immutable transaction logs; maintain migration scripts.  
* Gemini AI Integration: Build robust AI photo judge service to evaluate pet image validity, quality, and species classification with error handling.  
* Quest & Logic Engine: Enforce strict server-side validation for Bond XP gains, anti-cheat quest verification, and passport eligibility criteria.  
* IPFS Metadata Upload: Implement automatic pinned IPFS JSON metadata and image storage generation upon pet passport eligibility.

### Member 03: Blockchain & Web3 \- Detailed Task Breakdown

* Smart Contract Development: Write, test, and optimize PawsAndPicketPassport.sol ERC-721 contract with secure minting constraints.  
* EIP-712 Cryptographic Signatures: Implement trusted backend signer service to generate EIP-712 mint authorization signatures for eligible pets.  
* Core Wallet Integration: Develop frontend Web3 provider integration for Core Wallet connection, network switching, and transaction submission.  
* Deployment & Verification: Deploy smart contract to Avalanche Fuji Testnet and verify contract source code on Snowtrace Explorer.  
* RPC & Web3 Service Management: Configure reliable RPC endpoints, fallback providers, and event listeners for real-time mint confirmation monitoring.

### Shared Data Models (API Contract)

PetProfile Interface: id (string), name (string), species (string), imageUrl (string), bondXp (number), bondLevel (number), discoveryStatus (string), passportEligible (boolean), optional passportTokenId (string).

## 6\. 3-DAY EXECUTION ROADMAP

### DAY 1: Stabilize & Foundation

* M1: Freeze UI flow & Pet Journey screens.  
* M2: Audit DB schema, Gemini AI judge, & quest logic.  
* M3: Audit PawsAndPicketPassport.sol & deploy to Avalanche Fuji.  
* Team: Finalize API interface and environment variables.

### DAY 2: Vertical Slice Integration

* M1: Complete Passport Mint UI & Gallery screen.  
* M2: Wire eligibility check, IPFS metadata, and receipt verification.  
* M3: Connect Core Wallet flow & live transaction execution.  
* Team: End-to-end integration test (Discovery \-\> Mint).

### DAY 3: Polish, Fallbacks & Submission

* M1/M2/M3: Bug fixes, server persistence check, setup fallbacks for RPC/AI errors.  
* Deliverables: Verified contract link, README with architecture diagram, demo video, and pitch deck.

## 7\. DEFINITION OF DONE CHECKLIST

* Photo upload & AI Judge returns accurate classification.  
* Pet correctly created and rendered in Sanctuary.  
* Care actions (Feed/Play) increase Bond XP on backend.  
* Tutorial quest completes and prevents duplicate XP claims.  
* DB state persists across server restarts.  
* Core Wallet connects to Avalanche Fuji.  
* EIP-712 claim signature generated by backend.  
* ERC-721 Passport minted with IPFS metadata URI and verified on Snowtrace.  
* Public Gallery displays minted Passport.