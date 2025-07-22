// loadNFTs.js
const {Web3} = require('web3');

// Carga ABI y dirección del contrato
const contractJson = require('../../../build/contracts/NFTBitwiseShop.json');
const CONTRACT_ADDRESS = contractJson.networks['5777'].address; 
const ABI = contractJson.abi;

// Conexión a Ganache
const web3 = new Web3('http://127.0.0.1:7545');

(async () => {
  const accounts = await web3.eth.getAccounts();
  const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

  // Datos de ejemplo para los NFTs
  const prices = [
    web3.utils.toWei("3", "ether"),
    web3.utils.toWei("2.5", "ether"),
    web3.utils.toWei("1.8", "ether")
  ];

  const images = [
    "cyberpunk-bitcoin-illustration.jpg",
    "milad-fakurian-p4VEmF2SQdU-unsplash.jpg",
    "li-zhang-HYwU-Fl6IoM-unsplash.jpg"
  ];

  const artists = [
    "Viktor Vektor",
    "Lincoln Clay",
    "Panam Palmer"
  ];

  const owners = [
    accounts[1],
    accounts[2],
    accounts[3]
  ];

  console.log("Enviando transacción para crear NFTs...");

  try {
    const receipt = await contract.methods.createNFTs(owners, prices, images, artists)
      .send({ from: accounts[0], gas: 3000000 });

    console.log("NFTs creados exitosamente:");
    console.log(receipt.events);
  } catch (err) {
    console.error("Error al crear NFTs:", err.message);
  }
})();
