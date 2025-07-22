const NFTBitwiseShop = artifacts.require("NFTBitwiseShop");
const truffleAssert = require("truffle-assertions");
const BN = web3.utils.BN;
const { toWei } = web3.utils;

contract("NFTBitwiseShop", (accounts) => {
  const [admin, buyer, other] = accounts;
  let instance;

  beforeEach(async () => {
    instance = await NFTBitwiseShop.new({ from: admin });
  });

  describe("NFT Creation", () => {
    it("should create NFT and assign correct owner", async () => {
      await instance.createNFT(
        "Test NFT",
        toWei("0.01", "ether"),
        "ipfs://testhash",
        "Test Artist",
        buyer,
        { from: admin }
      );

      const nft = await instance.nfts(1);
      assert.equal(nft.name, "Test NFT");
      assert.equal(nft.owner, buyer);
      assert.equal(nft.artist, "Test Artist");
      assert.equal(nft.image, "ipfs://testhash");
    });

    it("should fail if non-owner tries to create NFT", async () => {
      await truffleAssert.reverts(
        instance.createNFT(
          "Invalid NFT",
          toWei("0.01", "ether"),
          "ipfs://testhash",
          "Someone",
          buyer,
          { from: buyer }
        ),
        "Not contract owner"
      );
    });

    it("should reject NFT creation with zero price", async () => {
      await truffleAssert.reverts(
        instance.createNFT(
          "Free NFT",
          0,
          "ipfs://test",
          "Nobody",
          buyer,
          { from: admin }
        ),
        "Price must be greater than 0"
      );
    });
  });

  describe("NFT Purchase", () => {
    beforeEach(async () => {
      await instance.createNFT(
        "Buyable NFT",
        toWei("0.02", "ether"),
        "ipfs://img",
        "Seller",
        admin,
        { from: admin }
      );
    });

    it("should allow valid purchase and transfer ownership", async () => {
      const nftBefore = await instance.nfts(1);
      const byteA = nftBefore.byteA;
      const byteB = nftBefore.byteB;
      const op = nftBefore.op.toNumber();

      const expected = op === 0
        ? new BN(byteA).and(new BN(byteB))
        : new BN(byteA).or(new BN(byteB));

      const sellerBalanceBefore = new BN(await web3.eth.getBalance(admin));

      await instance.purchaseNFT(1, expected.toNumber(), {
        from: buyer,
        value: toWei("0.02", "ether")
      });

      const nftAfter = await instance.nfts(1);
      assert.equal(nftAfter.owner, buyer, "NFT owner should be updated");
      assert.notEqual(nftBefore.byteA, nftAfter.byteA, "byteA should be updated");
      assert.notEqual(nftBefore.byteB, nftAfter.byteB, "byteB should be updated");

      const sellerBalanceAfter = new BN(await web3.eth.getBalance(admin));
      assert(sellerBalanceAfter.gt(sellerBalanceBefore), "Seller should receive ETH");
    });

    it("should reject purchase with incorrect bitwise result", async () => {
      await truffleAssert.reverts(
        instance.purchaseNFT(1, 123, {
          from: buyer,
          value: toWei("0.02", "ether")
        }),
        "Incorrect bitwise result"
      );
    });

    it("should reject underpaid purchase", async () => {
      const nft = await instance.nfts(1);
      const byteA = nft.byteA;
      const byteB = nft.byteB;
      const op = nft.op.toNumber();

      const expected = op === 0
        ? new BN(byteA).and(new BN(byteB))
        : new BN(byteA).or(new BN(byteB));

      await truffleAssert.reverts(
        instance.purchaseNFT(1, expected.toNumber(), {
          from: buyer,
          value: toWei("0.005", "ether")
        }),
        "Insufficient payment"
      );
    });

    it("should reject repurchase of owned NFT", async () => {
      const nft = await instance.nfts(1);
      const byteA = nft.byteA;
      const byteB = nft.byteB;
      const op = nft.op.toNumber();

      const expected = op === 0
        ? new BN(byteA).and(new BN(byteB))
        : new BN(byteA).or(new BN(byteB));

      await instance.purchaseNFT(1, expected.toNumber(), {
        from: buyer,
        value: toWei("0.02", "ether")
      });

      await truffleAssert.reverts(
        instance.purchaseNFT(1, expected.toNumber(), {
          from: buyer,
          value: toWei("0.02", "ether")
        }),
        "You already own this NFT"
      );
    });

    it("should reject purchase with invalid NFT ID", async () => {
      await truffleAssert.reverts(
        instance.purchaseNFT(999, 0, {
          from: buyer,
          value: toWei("0.02", "ether")
        }),
        "Invalid NFT ID"
      );
    });
  });
});
