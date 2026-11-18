// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721Utils} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Utils.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title PawsAndPicketPassport
 * @notice Pet Passport ERC-721 for Paws & Picket on Avalanche Fuji (43113).
 * Phase 1 enforces soulbound custody: direct transfers and approvals revert, and
 * player-to-player adoption transfer endpoints are disabled until Phase 2.
 */
contract PawsAndPicketPassport is ERC721, ERC721URIStorage, Ownable, EIP712 {
    bytes32 public constant MINT_CLAIM_TYPEHASH =
        keccak256(
            "MintClaim(address recipient,bytes32 petIdHash,bytes32 metadataUriHash,uint256 nonce,uint256 deadline)"
        );
    bool public constant ADOPTION_TRANSFERS_ENABLED = false;

    struct PetPassport {
        bytes32 petIdHash;
        address originalDiscoverer;
        uint64 discoveredAt;
        uint64 mintedAt;
    }

    struct AdoptionOffer {
        address from;
        address to;
        uint64 expiresAt;
        bool active;
    }

    address public claimSigner;
    uint256 private _nextTokenId = 1;
    bool private _allowAdoptionTransfer;

    mapping(uint256 tokenId => PetPassport) public passports;
    mapping(bytes32 petIdHash => uint256 tokenId) public tokenByPetId;
    mapping(uint256 nonce => bool) public usedNonces;
    mapping(uint256 tokenId => AdoptionOffer) public adoptionOffers;

    error DirectTransferBlocked();
    error AdoptionTransfersDisabled();
    error InvalidClaimSigner();
    error InvalidRecipient();
    error EmptyMetadataUri();
    error ClaimExpired();
    error NonceAlreadyUsed();
    error PetAlreadyMinted();
    error InvalidSignature();
    error NotPetOwner();
    error InvalidAdoptionTarget();
    error InvalidDuration();
    error NoActiveAdoptionOffer();
    error NotIntendedAdopter();
    error AdoptionOfferExpired();
    error OfferOwnerMismatch();

    event ClaimSignerUpdated(address indexed previousSigner, address indexed newSigner);
    event PetMinted(
        uint256 indexed tokenId,
        bytes32 indexed petIdHash,
        address indexed discoverer,
        string metadataUri,
        uint256 nonce
    );
    event AdoptionOffered(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint64 expiresAt
    );
    event AdoptionCancelled(uint256 indexed tokenId, address indexed cancelledBy);
    event AdoptionCompleted(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        bytes32 petIdHash
    );

    constructor(address initialOwner, address initialClaimSigner)
        ERC721("Paws & Picket Pet Passport", "PAWS")
        Ownable(initialOwner)
        EIP712("PawsAndPicketPassport", "1")
    {
        if (initialClaimSigner == address(0)) revert InvalidClaimSigner();
        claimSigner = initialClaimSigner;
    }

    function setClaimSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert InvalidClaimSigner();
        address prev = claimSigner;
        claimSigner = newSigner;
        emit ClaimSignerUpdated(prev, newSigner);
    }

    function mintWithClaim(
        address recipient,
        bytes32 petIdHash,
        string calldata metadataUri,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external returns (uint256 tokenId) {
        if (recipient == address(0) || msg.sender != recipient) revert InvalidRecipient();
        if (bytes(metadataUri).length == 0) revert EmptyMetadataUri();
        if (block.timestamp > deadline) revert ClaimExpired();
        if (usedNonces[nonce]) revert NonceAlreadyUsed();
        if (tokenByPetId[petIdHash] != 0) revert PetAlreadyMinted();

        bytes32 structHash = keccak256(
            abi.encode(
                MINT_CLAIM_TYPEHASH,
                recipient,
                petIdHash,
                keccak256(bytes(metadataUri)),
                nonce,
                deadline
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);
        if (recovered != claimSigner) revert InvalidSignature();

        usedNonces[nonce] = true;
        tokenId = _nextTokenId++;
        tokenByPetId[petIdHash] = tokenId;

        passports[tokenId] = PetPassport({
            petIdHash: petIdHash,
            originalDiscoverer: recipient,
            discoveredAt: uint64(block.timestamp),
            mintedAt: uint64(block.timestamp)
        });

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataUri);

        emit PetMinted(tokenId, petIdHash, recipient, metadataUri, nonce);
    }

    function createAdoptionOffer(
        uint256 tokenId,
        address to,
        uint64 durationSeconds
    ) external {
        if (!ADOPTION_TRANSFERS_ENABLED) revert AdoptionTransfersDisabled();
        address owner = ownerOf(tokenId);
        if (msg.sender != owner) revert NotPetOwner();
        if (to == address(0) || to == owner) revert InvalidAdoptionTarget();
        if (durationSeconds == 0 || durationSeconds > 30 days) revert InvalidDuration();

        uint64 expiresAt = uint64(block.timestamp) + durationSeconds;
        adoptionOffers[tokenId] = AdoptionOffer({
            from: owner,
            to: to,
            expiresAt: expiresAt,
            active: true
        });

        emit AdoptionOffered(tokenId, owner, to, expiresAt);
    }

    function cancelAdoptionOffer(uint256 tokenId) external {
        if (!ADOPTION_TRANSFERS_ENABLED) revert AdoptionTransfersDisabled();
        AdoptionOffer memory offer = adoptionOffers[tokenId];
        if (!offer.active) revert NoActiveAdoptionOffer();
        address owner = ownerOf(tokenId);
        if (msg.sender != owner && msg.sender != offer.from) revert NotPetOwner();

        delete adoptionOffers[tokenId];
        emit AdoptionCancelled(tokenId, msg.sender);
    }

    function acceptAdoption(uint256 tokenId) external {
        if (!ADOPTION_TRANSFERS_ENABLED) revert AdoptionTransfersDisabled();
        AdoptionOffer memory offer = adoptionOffers[tokenId];
        if (!offer.active) revert NoActiveAdoptionOffer();
        if (msg.sender != offer.to) revert NotIntendedAdopter();
        if (block.timestamp > offer.expiresAt) revert AdoptionOfferExpired();
        if (ownerOf(tokenId) != offer.from) revert OfferOwnerMismatch();

        delete adoptionOffers[tokenId];

        _allowAdoptionTransfer = true;
        _update(msg.sender, tokenId, address(0));
        _allowAdoptionTransfer = false;

        ERC721Utils.checkOnERC721Received(_msgSender(), offer.from, msg.sender, tokenId, "");

        emit AdoptionCompleted(tokenId, offer.from, msg.sender, passports[tokenId].petIdHash);
    }

    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert DirectTransferBlocked();
    }

    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        revert DirectTransferBlocked();
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (
            from != address(0) &&
            to != address(0) &&
            (!ADOPTION_TRANSFERS_ENABLED || !_allowAdoptionTransfer)
        ) {
            revert DirectTransferBlocked();
        }
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
