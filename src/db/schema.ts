import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export interface PetMemoryRecord {
  id: string;
  kind: string;
  note: string;
  createdAt: string;
}

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull().default('Keeper'),
  isGuest: boolean('is_guest').notNull().default(false),
  firstBondQuestClaimedAt: timestamp('first_bond_quest_claimed_at'),
  firstBondQuestPetUid: text('first_bond_quest_pet_uid'),
  coins: integer('coins').notNull().default(12560),
  energy: integer('energy').notNull().default(45),
  maxEnergy: integer('max_energy').notNull().default(50),
  level: integer('level').notNull().default(12),
  expPercent: integer('exp_percent').notNull().default(64),
  streakDays: integer('streak_days').notNull().default(7),
  fenceExpiresAt: timestamp('fence_expires_at').notNull(),
  waterCharges: integer('water_charges').notNull().default(8),
  maxWater: integer('max_water').notNull().default(8),
  luredRescued: boolean('lured_rescued').notNull().default(false),
  activeBait: text('active_bait'),
  limitsDate: text('limits_date').notNull(),
  petCoinsUsed: integer('pet_coins_used').notNull().default(2),
  playCoinsUsed: integer('play_coins_used').notNull().default(0),
  feedCoinsUsed: integer('feed_coins_used').notNull().default(0),
  cloverCoinsUsed: integer('clover_coins_used').notNull().default(0),
  seedInventory: jsonb('seed_inventory').$type<Record<string, number>>().notNull(),
  foodInventory: jsonb('food_inventory').$type<Record<string, number>>().notNull(),
  ownedShopItems: jsonb('owned_shop_items').$type<string[]>().notNull(),
  ownedToys: jsonb('owned_toys').$type<string[]>().notNull(),
  farmPlots: jsonb('farm_plots').$type<unknown[]>().notNull(),
  orchardTrees: jsonb('orchard_trees').$type<unknown[]>().notNull(),
  marketListings: jsonb('market_listings').$type<unknown[]>().notNull(),
  neighborStates: jsonb('neighbor_states').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const wallets = pgTable(
  'wallets',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    address: text('address').notNull(),
    chainId: integer('chain_id').notNull().default(43113),
    verifiedAt: timestamp('verified_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('wallets_address_unique').on(table.address),
    uniqueIndex('wallets_user_id_unique').on(table.userId),
  ]
);

export const authNonces = pgTable(
  'auth_nonces',
  {
    id: serial('id').primaryKey(),
    nonce: text('nonce').notNull().unique(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    walletAddress: text('wallet_address').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('auth_nonces_user_idx').on(table.userId)]
);

export const pets = pgTable(
  'pets',
  {
    id: serial('id').primaryKey(),
    petUid: text('pet_uid').notNull().unique(),
    originalDiscovererId: integer('original_discoverer_id')
      .references(() => users.id)
      .notNull(),
    originalDiscovererUid: text('original_discoverer_uid').notNull(),
    originalDiscovererWallet: text('original_discoverer_wallet'),
    currentOwnerId: integer('current_owner_id')
      .references(() => users.id)
      .notNull(),
    name: text('name').notNull(),
    species: text('species').notNull(),
    pose: text('pose').notNull().default('Playful'),
    photoUrl: text('photo_url').notNull(),
    cutoutMode: text('cutout_mode').notNull().default('auto'),
    posX: integer('pos_x').notNull().default(48),
    posY: integer('pos_y').notNull().default(52),
    flip: boolean('flip').notNull().default(false),
    needsCare: text('needs_care'),
    accessory: text('accessory'),
    discoveryScore: integer('discovery_score').notNull().default(0),
    bondXp: integer('bond_xp').notNull().default(0),
    careCount: integer('care_count').notNull().default(0),
    questPetDone: boolean('quest_pet_done').notNull().default(false),
    questFeedDone: boolean('quest_feed_done').notNull().default(false),
    questPlayDone: boolean('quest_play_done').notNull().default(false),
    memories: jsonb('memories').$type<PetMemoryRecord[]>().notNull(),
    discoveredAt: timestamp('discovered_at').defaultNow().notNull(),
    sourceSubmissionUid: text('source_submission_uid'),
    mintStatus: text('mint_status').notNull().default('unminted'),
    chainId: integer('chain_id'),
    contractAddress: text('contract_address'),
    tokenId: text('token_id'),
    mintTxHash: text('mint_tx_hash'),
    metadataUri: text('metadata_uri'),
    ipfsCid: text('ipfs_cid'),
    onChainOwner: text('on_chain_owner'),
    mintedAt: timestamp('minted_at'),
  },
  (table) => [
    index('pets_owner_idx').on(table.currentOwnerId),
    index('pets_discoverer_idx').on(table.originalDiscovererId),
    uniqueIndex('pets_mint_tx_hash_unique').on(table.mintTxHash),
  ]
);

export const photoSubmissions = pgTable(
  'photo_submissions',
  {
    id: serial('id').primaryKey(),
    submissionUid: text('submission_uid').notNull().unique(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    imageSha256: text('image_sha256').notNull(),
    mimeType: text('mime_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    photoUrl: text('photo_url').notNull(),
    theme: text('theme').notNull(),
    isAnimal: boolean('is_animal').notNull(),
    confidence: integer('confidence').notNull(),
    overallScore: integer('overall_score').notNull(),
    verdict: text('verdict').notNull(),
    tierLabel: text('tier_label').notNull(),
    sharp: integer('sharp').notNull(),
    light: integer('light').notNull(),
    species: text('species').notNull(),
    pose: text('pose').notNull(),
    themeScore: integer('theme_score').notNull(),
    themeMatch: boolean('theme_match').notNull(),
    petName: text('pet_name').notNull(),
    coinsReward: integer('coins_reward').notNull(),
    expReward: integer('exp_reward').notNull(),
    addedToGarden: boolean('added_to_garden').notNull().default(false),
    petUid: text('pet_uid'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('photo_submissions_user_hash_unique').on(
      table.userId,
      table.imageSha256
    ),
    index('photo_submissions_user_idx').on(table.userId),
  ]
);

export const careLogs = pgTable(
  'care_logs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    petUid: text('pet_uid').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    actionType: text('action_type').notNull(),
    coinsDelta: integer('coins_delta').notNull().default(0),
    expDelta: integer('exp_delta').notNull().default(0),
    bondXpDelta: integer('bond_xp_delta').notNull().default(0),
    resultPayload: jsonb('result_payload').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('care_logs_user_idempotency_unique').on(
      table.userId,
      table.idempotencyKey
    ),
    index('care_logs_pet_idx').on(table.petUid),
  ]
);

export const mintClaims = pgTable(
  'mint_claims',
  {
    id: serial('id').primaryKey(),
    petUid: text('pet_uid').notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    walletAddress: text('wallet_address').notNull(),
    contractAddress: text('contract_address').notNull(),
    chainId: integer('chain_id').notNull().default(43113),
    nonce: text('nonce').notNull().unique(),
    deadline: integer('deadline').notNull(),
    metadataUri: text('metadata_uri').notNull(),
    signature: text('signature').notNull(),
    status: text('status').notNull().default('issued'),
    txHash: text('tx_hash'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('mint_claims_pet_idx').on(table.petUid)]
);

export const adoptionOffers = pgTable(
  'adoption_offers',
  {
    id: serial('id').primaryKey(),
    offerUid: text('offer_uid').notNull().unique(),
    petUid: text('pet_uid').notNull(),
    fromUserId: integer('from_user_id')
      .references(() => users.id)
      .notNull(),
    fromWallet: text('from_wallet'),
    toUserId: integer('to_user_id').references(() => users.id),
    toEmail: text('to_email'),
    toWallet: text('to_wallet'),
    note: text('note'),
    isOnChain: boolean('is_on_chain').notNull().default(false),
    offerTxHash: text('offer_tx_hash'),
    acceptTxHash: text('accept_tx_hash'),
    status: text('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at'),
  },
  (table) => [
    index('adoption_offers_pet_idx').on(table.petUid),
    index('adoption_offers_to_wallet_idx').on(table.toWallet),
  ]
);

export const ipfsConsents = pgTable(
  'ipfs_consents',
  {
    id: serial('id').primaryKey(),
    consentUid: text('consent_uid').notNull().unique(),
    petUid: text('pet_uid').notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    userUid: text('user_uid'),
    walletAddress: text('wallet_address').notNull(),
    consentVersion: text('consent_version').notNull(),
    disclosureReference: text('disclosure_reference').notNull(),
    disclosures: jsonb('disclosures').$type<string[]>().notNull(),
    consentedAt: timestamp('consented_at').notNull(),
    status: text('status').notNull().default('granted'),
    revokedAt: timestamp('revoked_at'),
    revokedByUserId: integer('revoked_by_user_id'),
    revocationReason: text('revocation_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('ipfs_consents_active_pet_version_unique')
      .on(table.petUid, table.consentVersion)
      .where(sql`${table.status} IN ('granted', 'minted')`),
    index('ipfs_consents_pet_idx').on(table.petUid),
    index('ipfs_consents_user_idx').on(table.userId),
    index('ipfs_consents_wallet_idx').on(table.walletAddress),
  ]
);
