# **Member 02 — Immediate Backend Development Priorities**

Execution plan · Priority P0

**Mission:** Make Paws & Picket's backend the single source of truth for pet discovery, care progression, Bond XP, quest completion, and Pet Passport eligibility.

Member 02 should focus on completing the backend vertical slice:

`AI Judge → Pet Creation → Care Actions → Bond XP → First Bond Quest → Mint Eligibility`

Do not expand Farm, Neighbor, Adoption, or new blockchain features until this flow is reliable.

The priorities below are based on the Paws & Picket architecture and requirements in the project specification.&#x20;

Pasted text(1).txt



## **1. Priority overview**

| Priority | Task                     | Expected result                                    |
| -------- | ------------------------ | -------------------------------------------------- |
| P0.1     | API audit                | Identify broken, incomplete and insecure endpoints |
| P0.2     | AI Judge testing         | Reliable animal image analysis and validation      |
| P0.3     | Pet lifecycle            | Validated discovery-to-Sanctuary flow              |
| P0.4     | Bond XP                  | Server-authoritative XP calculation                |
| P0.5     | First Bond Quest         | Pet → Feed → Play progression                      |
| P0.6     | Eligibility verification | Secure mint eligibility decision                   |
| P0.7     | Persistence & security   | No duplicate claims or lost progress               |
| P0.8     | Integration              | Stable API contracts for Members 01 and 03         |

## **2. P0.1 — API audit**

Do first

**Objective:** Understand what already works before changing implementation.

Tasks:

- List all existing Express routes.
- Identify frontend API calls and their corresponding endpoints.
- Check request validation and response formats.
- Identify endpoints returning mock/static data.
- Find incomplete implementations and TODOs.
- Check authentication requirements.
- Check database queries and error handling.
- Identify duplicated business logic.
- Verify PostgreSQL persistence after server restart.

Pay particular attention to:

| Domain         | What to inspect                                   |
| -------------- | ------------------------------------------------- |
| Authentication | Guest session and wallet-linked identity          |
| AI Judge       | Upload, analysis, validation, duplicate detection |
| Pet            | Creation, retrieval, ownership                    |
| Care           | Feed, Play, Pet actions                           |
| Bond           | XP updates and level calculation                  |
| Quest          | Progress, completion, claiming                    |
| Passport       | Eligibility and mint claim integration            |

**Deliverable:** `BACKEND_AUDIT.md`

It must contain:

- Existing endpoint list.
- Working / broken / incomplete status.
- Relevant source files.
- Bugs and security risks.
- Required fixes, ranked by priority.

Do not rewrite working modules just for code cleanliness.

## **3. P0.2 — AI Judge testing**

**Objective:** Ensure only valid animal discoveries can enter the Pet Journey.

The project specification defines two important thresholds:

- AI confidence ≥ 0.85.
- Image score ≥ 80.

It also requires duplicate detection and valid animal classification.&#x20;

Pasted text(1).txt



### **Testing matrix**

| Test case                | Expected result                                         |
| ------------------------ | ------------------------------------------------------- |
| Clear dog photo          | Accept if thresholds pass                               |
| Clear cat photo          | Accept if thresholds pass                               |
| Non-animal photo         | Reject                                                  |
| Blurry animal photo      | Reject or request retake                                |
| Screenshot of an animal  | Flag for review / reject according to validation policy |
| Duplicate uploaded image | Reject duplicate discovery                              |
| Same pet submitted twice | Prevent duplicate Pet creation where detectable         |
| AI timeout               | Return recoverable error                                |
| Invalid AI response      | Fail safely; never auto-approve                         |

### **Implementation requirements**

1. Validate file type, size and image format.
2. Use Gemini structured JSON output.
3. Validate AI response server-side.
4. Normalize species names.
5. Apply confidence and image-score thresholds.
6. Store AI analysis and discovery status in PostgreSQL.
7. Add duplicate-image detection, preferably using image hashes or perceptual hashes.
8. Prevent the frontend from overriding AI results.

Suggested response contract:

```
interface JudgeResult {
  accepted: boolean;
  species: string | null;
  confidence: number;
  imageScore: number;
  reason: string;
  duplicate: boolean;
  discoveryId?: string;
}
```

**Acceptance criteria:**

- Valid images can proceed to Pet creation.
- Invalid images cannot create a mint-eligible pet.
- AI failures never silently approve an image.
- Duplicate submissions do not create duplicate discoveries.
- Results are persisted and auditable.

Important: AI classification is not proof of real-world ownership or proof that an animal was physically discovered at a particular location. The product should describe this as image-based discovery validation.

## **4. P0.3 — Pet lifecycle and database consistency**

**Objective:** Ensure every pet has one stable identity throughout the game.

Implement and verify:

```
DISCOVERED
    ↓
ANALYZED
    ↓
APPROVED
    ↓
IN_SANCTUARY
    ↓
CARE_IN_PROGRESS
    ↓
MINT_ELIGIBLE
    ↓
MINTED
```

The backend should own these transitions.

Tasks:

- Assign a unique Pet ID.
- Store the discovery image reference.
- Store AI analysis.
- Store original discoverer.
- Store creation timestamp.
- Track Sanctuary membership.
- Track Bond XP and Bond Level.
- Track quest progress.
- Track mint status and token ID.
- Prevent invalid state transitions.

A pet must not be mint-eligible just because the frontend sends `passportEligible: true`.

## **5. P0.4 — Bond XP implementation**

Core gameplay logic

**Objective:** Make Bond XP a reliable representation of player care.

The intended gameplay is based on three initial actions:

- Pet
- Feed
- Play

The First Bond Quest connects these actions to the early pet-care progression.

### **Suggested implementation**

Use server-controlled action definitions.

| Action           | Example reward | Validation                   |
| ---------------- | -------------- | ---------------------------- |
| Pet              | 10 XP          | Valid pet interaction        |
| Feed             | 20 XP          | Food consumed successfully   |
| Play             | 20 XP          | Valid play interaction       |
| Quest completion | 50 XP          | All required steps completed |

These XP values are proposed balancing values, not confirmed existing project constants. Keep the existing gameMeta.ts configuration if it already defines the intended economy.

### **Backend logic**

Create a central function:

```
async function performCareAction(
  userId: string,
  petId: string,
  action: "pet" | "feed" | "play"
) {
  // 1. Verify user and pet ownership
  // 2. Validate pet state
  // 3. Validate action requirements
  // 4. Prevent abuse / duplicate rewards
  // 5. Record care event
  // 6. Calculate XP server-side
  // 7. Update Bond XP
  // 8. Update quest progress
  // 9. Return updated state
}
```

### **Anti-abuse requirements**

- No client-submitted XP values.
- No direct endpoint for adding arbitrary Bond XP.
- Validate inventory before Feed rewards.
- Apply action cooldowns where appropriate.
- Use database transactions for action + reward updates.
- Use idempotency keys or unique event constraints to prevent duplicate rewards.
- Keep a care-event history.

### **Acceptance criteria**

- A valid care action awards XP exactly once.
- An invalid action awards zero XP.
- Repeated requests cannot farm unlimited rewards.
- Bond XP survives reload and server restart.
- Bond Level is calculated consistently.
- Frontend receives updated pet and quest state.

## **6. P0.5 — First Bond Quest**

**Objective:** Turn the first care interactions into a structured progression system.

**First Bond Quest**

**1. Pet your pet**

Required

**2. Feed your pet**

Required

**3. Play with your pet**

Required

**Quest completion**

# **100 XP**

Illustrative reward configuration; align with existing gameMeta.ts.

Tasks:

- Define quest ID and version.
- Store quest progress per player and pet.
- Track each required action.
- Prevent duplicate action completion.
- Validate all conditions on the backend.
- Implement quest completion.
- Implement one-time reward claiming.
- Return progress to frontend.

Suggested API:

| Method | Endpoint                              | Purpose                 |
| ------ | ------------------------------------- | ----------------------- |
| GET    | `/api/quests/first-bond/:petId`       | Retrieve progress       |
| POST   | `/api/pets/:petId/care`               | Perform care action     |
| POST   | `/api/quests/first-bond/:petId/claim` | Claim completion reward |

These are proposed API contracts; audit existing routes before introducing new ones.

**Acceptance criteria:** The player cannot claim the quest before completing all three actions, and cannot claim it twice.

## **7. P0.6 — Pet Passport eligibility verification**

Critical Web3 dependency

**Objective:** Backend must decide whether a pet is genuinely eligible for minting before Member 03 signs an EIP-712 claim.

The project specification defines these requirements:

### **Discovery requirements**

- AI confidence ≥ 0.85.
- Image score ≥ 80.
- Valid animal image.
- No duplicate discovery.
- Pet added to Sanctuary.

### **Care requirements**

- Bond Level ≥ 3.
- First Bond Quest completed.
- Care events verified by backend.
- Pet has not already been minted.&#x20;

  Pasted text(1).txt



### **Suggested eligibility function**

```
interface MintEligibility {
  eligible: boolean;
  petId: string;
  reasons: string[];
  requirements: {
    validDiscovery: boolean;
    confidencePassed: boolean;
    imageScorePassed: boolean;
    duplicateCheckPassed: boolean;
    inSanctuary: boolean;
    bondLevelPassed: boolean;
    firstBondQuestCompleted: boolean;
    careEventsVerified: boolean;
    notMinted: boolean;
  };
}
```

### **API**

```
GET /api/pets/:petId/mint-eligibility
```

Example response:

```
{
  "eligible": false,
  "petId": "pet_123",
  "reasons": [
    "BOND_LEVEL_TOO_LOW"
  ],
  "requirements": {
    "validDiscovery": true,
    "confidencePassed": true,
    "imageScorePassed": true,
    "duplicateCheckPassed": true,
    "inSanctuary": true,
    "bondLevelPassed": false,
    "firstBondQuestCompleted": true,
    "careEventsVerified": true,
    "notMinted": true
  }
}
```

### **Critical backend rules**

1. Never trust eligibility values sent by the frontend.
2. Read the latest pet, quest and care records from PostgreSQL.
3. Verify all requirements server-side.
4. Prevent concurrent mint claims for the same pet.
5. Recheck eligibility before issuing a signed claim.
6. Store claim issuance and mint status.
7. Coordinate with Member 03 for the exact claim payload and signature format.

**Acceptance criteria:** A pet that fails even one required condition cannot receive a valid mint claim.

## **8. P0.7 — Persistence, security and error handling**

These tasks protect all the systems above.

| Task           | Requirement                                |
| -------------- | ------------------------------------------ |
| PostgreSQL     | All important game progress persists       |
| Transactions   | Care actions and XP updates are atomic     |
| Authentication | Verify user identity on protected routes   |
| Authorization  | Users cannot modify other users' pets      |
| Rate limiting  | Protect AI Judge and sensitive endpoints   |
| Validation     | Validate all API inputs                    |
| Error handling | Consistent error responses                 |
| Logging        | Record important gameplay and mint events  |
| Idempotency    | Prevent duplicate quest rewards and claims |

Particularly important: minting is a distributed process involving PostgreSQL and Avalanche. Do not assume a database transaction can atomically commit an on-chain transaction.

Use a pending state and reconciliation:

```
ELIGIBLE
   ↓
CLAIM_ISSUED
   ↓
MINT_PENDING
   ↓
MINT_CONFIRMED
```

If a transaction fails, times out or is replaced, the backend must be able to reconcile its actual blockchain status before allowing another mint attempt.

## **9. P0.8 — Integration with the other two members**

Member 02 should establish these interfaces early.

| Integration                   | What Member 02 provides                          |
| ----------------------------- | ------------------------------------------------ |
| Member 01 – Frontend          | Stable API response contracts                    |
| Member 03 – Blockchain        | Eligibility result and mint claim data           |
| Member 01 – Quest UI          | Pet, Bond XP, quest progress                     |
| Member 03 – Mint verification | Pet ID, claim status, transaction reconciliation |

Recommended ownership boundary:

- Member 02 owns `gameActions.ts`, `aiJudge.ts`, database game rules and eligibility.
- Member 03 owns `web3Service.ts`, wallet authentication integration and Solidity.
- Member 01 consumes the API and renders the results.

Member 02 should not modify Member 03's contract or signature implementation independently.

# **10. Immediate execution schedule**

Suggested schedule for Member 02, assuming the team is working toward the current hackathon submission.

Phase 1

**API Audit + AI Judge**

- Inventory routes.
- Identify incomplete endpoints.
- Test Gemini with real images.
- Fix image validation and duplicate detection.

Deliverable: `BACKEND_AUDIT.md` and tested Judge API.

Phase 2

**Pet Lifecycle + Bond XP**

- Normalize Pet state transitions.
- Implement care actions.
- Implement XP calculation.
- Add cooldown and duplicate protection.

Deliverable: Working care progression backed by PostgreSQL.

Phase 3

**First Bond Quest + Eligibility**

- Implement quest progression.
- Implement one-time reward.
- Implement mint eligibility.
- Integrate with Member 03's claim flow.

Deliverable: A backend-verified mint-eligible pet.

Phase 4

**Integration + Regression Testing**

- Test frontend API integration.
- Test mint status reconciliation.
- Test database persistence.
- Fix critical bugs.

Deliverable: End-to-end backend ready for demo.

## **11. Member 02 final acceptance checklist**

**Backend completion**

# **0/21**

**API & AI**

API audit document completed

All core API routes tested

AI Judge accepts valid animal photos

Invalid and duplicate photos rejected

AI failures handled safely

**Gameplay**

Pet lifecycle implemented

Feed / Pet / Play actions work

Bond XP calculated server-side

Duplicate XP rewards prevented

First Bond Quest works and cannot be claimed twice

**Web3 readiness**

Discovery requirements verified

Bond Level ≥ 3 verified

First Bond Quest verified

Care event history verified

Mint eligibility endpoint implemented

Already-minted pets rejected

Member 03 can consume eligibility data

**Reliability**

PostgreSQL persistence tested

Authentication and ownership checked

API validation and error handling implemented

Integration regression tests pass

## **12. The most important instruction for Member 02**

Do not start by rebuilding the backend.

Start by auditing what exists, then implement only the missing pieces.

The order of importance is:

1. **API audit** — know what works.
2. **AI Judge testing** — validate discovery.
3. **Bond XP** — establish trusted gameplay progression.
4. **First Bond Quest** — establish meaningful care achievements.
5. **Eligibility verification** — connect gameplay to Web3.
6. **Integration** — make the entire journey work.

## **Member 02's ultimate deliverable**

# **One verified, mint-eligible Pet**

A pet with a valid discovery record, persisted Sanctuary profile, verified care history, completed First Bond Quest and Bond Level 3 or higher.

Member 03 can then issue its mint claim, while Member 01 can display the entire journey.

**Recommended next step:** Have Member 02 use this plan to produce `BACKEND_AUDIT.md` first. That document becomes the shared source of truth before anyone starts modifying overlapping backend files.