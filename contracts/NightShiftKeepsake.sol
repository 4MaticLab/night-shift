// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title Night Shift Keepsake
/// @notice Testnet archive tokens for evidence already recovered in the Night Shift game.
contract NightShiftKeepsake is ERC721URIStorage, EIP712, Ownable {
    struct MintVoucher {
        address recipient;
        bytes32 campaignKey;
        bytes32 collectibleKey;
        bytes32 tokenUriHash;
        uint256 deadline;
    }

    error AlreadyMinted(address recipient, bytes32 campaignKey, bytes32 collectibleKey, uint256 tokenId);
    error ExpiredVoucher(uint256 deadline);
    error InvalidClaimSigner(address recovered);
    error InvalidSignerAddress();
    error InvalidMetadataUri();
    error RecipientMustRedeem(address caller, address recipient);

    uint256 private _nextTokenId = 1;
    mapping(bytes32 claim => uint256 tokenId) private _tokenByClaim;
    address public claimSigner;

    bytes32 private constant MINT_VOUCHER_TYPEHASH = keccak256(
        "MintVoucher(address recipient,bytes32 campaignKey,bytes32 collectibleKey,bytes32 tokenUriHash,uint256 deadline)"
    );

    event KeepsakeMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        bytes32 indexed campaignKey,
        bytes32 collectibleKey
    );
    event ClaimSignerChanged(address indexed priorSigner, address indexed nextSigner);

    constructor(address initialOwner, address initialClaimSigner)
        ERC721("Night Shift Keepsakes", "NIGHT")
        EIP712("Night Shift Keepsakes", "1")
        Ownable(initialOwner)
    {
        if (initialClaimSigner == address(0)) {
            revert InvalidSignerAddress();
        }
        claimSigner = initialClaimSigner;
    }

    function redeem(
        MintVoucher calldata voucher,
        string calldata metadataUri,
        bytes calldata signature
    ) external returns (uint256 tokenId) {
        if (msg.sender != voucher.recipient) {
            revert RecipientMustRedeem(msg.sender, voucher.recipient);
        }
        if (block.timestamp > voucher.deadline) {
            revert ExpiredVoucher(voucher.deadline);
        }
        if (keccak256(bytes(metadataUri)) != voucher.tokenUriHash) {
            revert InvalidMetadataUri();
        }

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    MINT_VOUCHER_TYPEHASH,
                    voucher.recipient,
                    voucher.campaignKey,
                    voucher.collectibleKey,
                    voucher.tokenUriHash,
                    voucher.deadline
                )
            )
        );
        address recovered = ECDSA.recover(digest, signature);
        if (recovered != claimSigner) {
            revert InvalidClaimSigner(recovered);
        }

        bytes32 claim = _claimKey(voucher.recipient, voucher.campaignKey, voucher.collectibleKey);
        uint256 existingTokenId = _tokenByClaim[claim];
        if (existingTokenId != 0) {
            revert AlreadyMinted(voucher.recipient, voucher.campaignKey, voucher.collectibleKey, existingTokenId);
        }

        tokenId = _nextTokenId++;
        _tokenByClaim[claim] = tokenId;
        _safeMint(voucher.recipient, tokenId);
        _setTokenURI(tokenId, metadataUri);

        emit KeepsakeMinted(voucher.recipient, tokenId, voucher.campaignKey, voucher.collectibleKey);
    }

    function tokenOf(
        address recipient,
        bytes32 campaignKey,
        bytes32 collectibleKey
    ) external view returns (uint256) {
        return _tokenByClaim[_claimKey(recipient, campaignKey, collectibleKey)];
    }

    function setClaimSigner(address nextSigner) external onlyOwner {
        if (nextSigner == address(0)) {
            revert InvalidSignerAddress();
        }
        address priorSigner = claimSigner;
        claimSigner = nextSigner;
        emit ClaimSignerChanged(priorSigner, nextSigner);
    }

    function _claimKey(
        address recipient,
        bytes32 campaignKey,
        bytes32 collectibleKey
    ) private pure returns (bytes32) {
        return keccak256(abi.encode(recipient, campaignKey, collectibleKey));
    }
}
