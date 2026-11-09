# Avalanche Contracts and Wallet

Develop on Fuji, deploy with Foundry or Hardhat, import OpenZeppelin Contracts. Check the current OpenZeppelin major version and the AA provider docs before writing code.

## Wallet and gas

Social login creates an ERC-4337 smart account; a paymaster sponsors gas. Add sponsorship rules: only allowlisted contract calls, per-user daily gas cap, and kill switch. Without caps, the paymaster becomes a free-gas faucet for attackers.

## Contract set

| Contract | Standard | Notes |
|---|---|---|
| `PawPet` | ERC-721 (+ metadata URI) | `mintWithSig(to, petId, statsHash, deadline, sig)`; `currentCustodian[tokenId]`; stats in metadata or a hash anchored on chain with data off-chain |
| `PawItems` | ERC-1155 | item ids for fragments, toys, bait, gear, sponsor vouchers; `burnToCraft(recipeId)` |
| `Kibble` | ERC-20 | optional in v1; settle batches from off-chain ledger via a Merkle claim or signed claim |
| `ReliefEscrow` | custom | locks/burns vouchers + Kibble, emits `ReliefPackDonated(donor, brandId, shelterId, packs, voucherIds)` |

## Signature-gated minting (EIP-712)

Backend signer signs `Mint(to, petId, statsHash, nonce, deadline)`. Contract checks: signer has `MINTER_SIGNER` role, `deadline` not passed, `petId` not already minted, `nonce` unused. Include `chainId` and contract address via the EIP-712 domain to stop replay across chains.

```solidity
// sketch, not audited
function mintWithSig(address to, uint256 petId, bytes32 statsHash, uint256 deadline, bytes calldata sig) external {
    require(block.timestamp <= deadline, "expired");
    require(!minted[petId], "exists");
    bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(MINT_TYPEHASH, to, petId, statsHash, deadline)));
    require(hasRole(SIGNER_ROLE, ECDSA.recover(digest, sig)), "bad sig");
    minted[petId] = true;
    _safeMint(to, petId);
}
```

## Custodian field

Keep `ownerOf` as true owner. Add `setCustodian(tokenId, addr)` callable only by a game-operator role (the lure outcome is decided off-chain). Transfers should clear the custodian. Marketplaces will show the owner only, so document that custodian is game-level state.

## Charity escrow

Redeem flow: user approves voucher burn -> `redeem(voucherId, brandId, shelterId)` -> burn + emit event -> sponsor dashboard listens to events and triggers real fulfilment. The chain proves redemption; it does not prove food arrived, so require shelter confirmation (signed receipt or photo) before marking a pack "delivered".

## Security checklist

Pausable, role-based access with multisig for admin, reentrancy guards on redeem, no unbounded loops, events for every state change, fuzz tests, independent audit before mainnet or any real-value voucher.
