let web3;
let contract;
let selectedAccount;

/**
 * Initialize Web3, connect MetaMask, and load the smart contract
 */
async function initWeb3() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      // Request MetaMask account
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      selectedAccount = accounts[0];

      // Display connected wallet
      const walletEl = document.getElementById("wallet-address");
      if (walletEl) walletEl.textContent = `Connected wallet: ${selectedAccount}`;

      // Get network ID and load contract
      const networkId = await web3.eth.net.getId();
      const res = await fetch('../build/contracts/NFTBitwiseShop.json');
      const json = await res.json();
      const deployedNetwork = json.networks[networkId];

      if (!deployedNetwork) {
        alert('Contract not deployed on this network');
        return;
      }

      contract = new web3.eth.Contract(json.abi, deployedNetwork.address);

      console.log("Connected to:", selectedAccount);
      console.log("Contract address:", deployedNetwork.address);

      await loadNFTs();

      // Listen for wallet account change
      window.ethereum.on("accountsChanged", async function (accounts) {
        selectedAccount = accounts[0];
        if (walletEl) walletEl.textContent = `Connected wallet: ${selectedAccount}`;
        await loadNFTs();
      });

    } catch (err) {
      console.error("MetaMask connection failed", err);
    }
  } else {
    alert("Please install MetaMask.");
  }
}

/**
 * Load and display all NFTs in the shop
 */
async function loadNFTs() {
  const count = await contract.methods.nftCount().call();
  const container = document.getElementById("nft-container");
  container.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const nft = await contract.methods.nfts(i).call();
    const isOwner = nft.owner.toLowerCase() === selectedAccount.toLowerCase();

    const byteA = parseInt(nft.byteA, 16);
    const byteB = parseInt(nft.byteB, 16);
    const op = parseInt(nft.op);
    const opName = op === 0 ? "AND" : "OR";

    // NFT card
    const card = document.createElement("div");
    card.className = "nft-card border rounded shadow p-4 m-2 bg-gray-800 text-white";

    card.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">${nft.name}</h3>
      <img src="${nft.image}" alt="${nft.name}" class="w-full h-48 object-cover rounded mb-2" />
      <p><strong>Artist:</strong> ${nft.artist}</p>
      <p><strong>Price:</strong> ${web3.utils.fromWei(nft.price, "ether")} ETH</p>
      <p><strong>Bitwise:</strong> ${byteA.toString(2).padStart(8, '0')} ${opName} ${byteB.toString(2).padStart(8, '0')}</p>
    `;

    if (isOwner) {
      const label = document.createElement("div");
      label.className = "mt-3 px-4 py-2 bg-blue-600 text-white text-center rounded font-bold";
      label.textContent = "You own this";
      card.appendChild(label);
    } else {
      // Input for result
      const input = document.createElement("input");
      input.type = "number";
      input.placeholder = "Enter an integer result";
      input.className = "mt-3 px-2 py-1 w-full rounded text-black";

      // Buy button
      const button = document.createElement("button");
      button.className = "mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded w-full font-semibold";
      button.textContent = "Buy";

      button.addEventListener("click", async () => {
        const result = parseInt(input.value);
        if (isNaN(result)) {
          alert("Please enter a valid integer.");
          input.classList.add("border-red-500");
          return;
        }

        try {
          await contract.methods.purchaseNFT(i, result).send({
            from: selectedAccount,
            value: nft.price
          });

          alert("NFT purchased successfully.");
          await loadNFTs(); // Refresh after purchase
        } catch (err) {
          alert("Purchase failed: " + err.message);
          console.error(err);
        }
      });

      card.appendChild(input);
      card.appendChild(button);
    }

    container.appendChild(card);
  }
}

// Load on page
window.addEventListener("load", initWeb3);
