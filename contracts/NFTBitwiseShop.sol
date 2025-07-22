// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

contract NFTBitwiseShop {
    address public owner;

    // Enum for bitwise operations
    enum Op { AND, OR }

    // NFT structure containing metadata and bitwise challenge
    struct NFT {
        string name;
        address owner;
        uint price;
        string image;
        string artist;
        bytes1 byteA;
        bytes1 byteB;
        Op op;
    }

    // Mapping to store NFTs by ID
    mapping(uint => NFT) public nfts;
    uint public nftCount = 0;

    // Event emitted when a new NFT is created
    event NFTCreated(
        uint id,
        string name,
        address indexed initialOwner,
        uint price,
        string image,
        Op op,
        bytes1 byteA,
        bytes1 byteB
    );

    // Event emitted when an NFT is purchased
    event NFTPurchased(
        uint id,
        address indexed buyer,
        uint price,
        Op op,
        bytes1 byteA,
        bytes1 byteB
    );

    // Modifier that restricts access to the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    // Constructor: sets the deployer of the contract as the owner
    constructor() public {
        owner = msg.sender;
    }

    /**
     * @dev Creates a new NFT with a bitwise challenge.
     * Only the contract owner can call this function.
     * It randomly generates two bytes and selects a bitwise operation (AND/OR).
     */
    function createNFT(
        string memory _name,
        uint _price,
        string memory _image,
        string memory _artist,
        address _initialOwner
    )
        public
        onlyOwner
    {
        require(_price > 0, "Price must be greater than 0");
        require(_initialOwner != address(0), "Initial owner must be valid");

        // Generate randomness for byte values and operation
        uint seed = uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty, nftCount)));
        bytes1 byteA = generateRandomByte(seed);
        bytes1 byteB = generateRandomByte(seed + 1);
        Op op = (seed % 2 == 0) ? Op.AND : Op.OR;

        // Increment counter and store NFT data
        nftCount++;
        nfts[nftCount] = NFT(
            _name,
            _initialOwner,
            _price,
            _image,
            _artist,
            byteA,
            byteB,
            op
        );

        // Emit event for NFT creation
        emit NFTCreated(nftCount, _name, _initialOwner, _price, _image, op, byteA, byteB);
    }

    /**
     * @dev Allows a user to purchase an NFT by providing the correct bitwise result.
     * Requires payment equal to or greater than the NFT price.
     * Ownership is transferred upon successful validation.
     */
    function purchaseNFT(uint _id, uint _result) public payable {
        require(_id > 0 && _id <= nftCount, "Invalid NFT ID");

        NFT storage nft = nfts[_id];

        require(msg.sender != nft.owner, "You already own this NFT");
        require(msg.value >= nft.price, "Insufficient payment");

        // Check if the buyer provided the correct bitwise result
        uint computed = computeBitwiseResult(nft.byteA, nft.byteB, nft.op);
        require(_result == computed, "Incorrect bitwise result");

        // Transfer payment to the current owner
        address payable seller = address(uint160(nft.owner));
        seller.transfer(msg.value);

        // Transfer ownership to the buyer
        nft.owner = msg.sender;

        // Generate a new bitwise challenge for the NFT
        uint seed = uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty, _id, msg.sender)));
        nft.byteA = generateRandomByte(seed);
        nft.byteB = generateRandomByte(seed + 1);
        nft.op = (seed % 2 == 0) ? Op.AND : Op.OR;

        // Emit event for NFT purchase
        emit NFTPurchased(_id, msg.sender, nft.price, nft.op, nft.byteA, nft.byteB);
    }

    /**
     * @dev Computes the result of the bitwise operation (AND/OR) between two bytes.
     * @param a First byte
     * @param b Second byte
     * @param op Operation to apply (AND or OR)
     * @return Result as unsigned integer
     */
    function computeBitwiseResult(bytes1 a, bytes1 b, Op op) internal pure returns (uint) {
        uint ua = uint8(a);
        uint ub = uint8(b);

        if (op == Op.AND) {
            return ua & ub;
        } else if (op == Op.OR) {
            return ua | ub;
        } else {
            revert("Unsupported operation");
        }
    }

    /**
     * @dev Generates a random byte using a seed value.
     * Uses keccak256 and bit manipulation to build an 8-bit value.
     * @param seed Source of pseudo-randomness
     * @return Random byte
     */
    function generateRandomByte(uint seed) internal pure returns (bytes1) {
        uint8 value = 0;
        for (uint i = 0; i < 8; i++) {
            if ((uint8(uint(keccak256(abi.encodePacked(seed, i))) % 2)) == 1) {
                value |= uint8(1 << (7 - i));
            }
        }
        return bytes1(value);
    }
}
