// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

contract NFTBitwiseShop {
    address public owner;

    enum Op { AND, OR }

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

    mapping(uint => NFT) public nfts;
    uint public nftCount = 0;

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

    event NFTPurchased(
        uint id,
        address indexed buyer,
        uint price,
        Op op,
        bytes1 byteA,
        bytes1 byteB
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

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

        uint seed = uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty, nftCount)));
        bytes1 byteA = generateRandomByte(seed);
        bytes1 byteB = generateRandomByte(seed + 1);
        Op op = (seed % 2 == 0) ? Op.AND : Op.OR;

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

        emit NFTCreated(nftCount, _name, _initialOwner, _price, _image, op, byteA, byteB);
    }

    function purchaseNFT(uint _id, uint _result) public payable {
        require(_id > 0 && _id <= nftCount, "Invalid NFT ID");

        NFT storage nft = nfts[_id];
        require(msg.sender != nft.owner, "You already own this NFT");
        require(msg.value >= nft.price, "Insufficient payment");

        uint computed = computeBitwiseResult(nft.byteA, nft.byteB, nft.op);
        require(_result == computed, "Incorrect bitwise result");

        address payable seller = address(uint160(nft.owner));
        seller.transfer(msg.value);

        nft.owner = msg.sender;

        uint seed = uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty, _id, msg.sender)));
        nft.byteA = generateRandomByte(seed);
        nft.byteB = generateRandomByte(seed + 1);
        nft.op = (seed % 2 == 0) ? Op.AND : Op.OR;

        emit NFTPurchased(_id, msg.sender, nft.price, nft.op, nft.byteA, nft.byteB);
    }

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
