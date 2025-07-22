const NFTBitwiseShop = artifacts.require("NFTBitwiseShop");

// Map of NFT images indexed by NFT ID (1 to 10)
const imageMap = {
  1: "src/images/cyberpunk-bitcoin-illustration.jpg",
  2: "src/images/cyberpunk-bitcoin-illustration(1).jpg",
  3: "src/images/iguana-neon-lights.jpg",
  4: "src/images/li-zhang-HYwU-Fl6IoM-unsplash.jpg",
  5: "src/images/luis-vasconcelos-wxj729MaPRY-unsplash.jpg",
  6: "src/images/michael-schiffer-9CSGSq_7UrA-unsplash.jpg",
  7: "src/images/milad-fakurian-p4VEmF2SQdU-unsplash.jpg",
  8: "src/images/mo-qAZEuKcGEiI-unsplash.jpg",
  9: "src/images/omk-fsz3b0UnwZ8-unsplash.jpg",
 10: "src/images/simon-lee-hbFKxsIqclc-unsplash.jpg"
};

module.exports = async function (deployer, network, accounts) {
  // Deploy the NFTBitwiseShop contract
  await deployer.deploy(NFTBitwiseShop);
  const instance = await NFTBitwiseShop.deployed();

  console.log("NFTBitwiseShop deployed at:", instance.address);

  // Create 10 NFTs and assign each to a different Ganache account
  for (let i = 0; i < 10; i++) {
    const id = i + 1;
    const name = `NFT #${id}`;
    const price = web3.utils.toWei("0.01", "ether"); // Fixed price for testing
    const image = imageMap[id];                      // Image from the imageMap
    const artist = `Artist ${id}`;                   // Placeholder artist name
    const owner = accounts[i];                       // Assign NFT to this Ganache account

    // Create the NFT using the contract's createNFT function
    await instance.createNFT(name, price, image, artist, owner, {
      from: accounts[0] // Must be the contract owner
    });

    console.log(`NFT ${id} created and assigned to ${owner}`);
  }
};
