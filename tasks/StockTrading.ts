import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("stock:create")
  .addParam("stockname", "Name of the stock (e.g., 'AAPL')")
  .addParam("tokenname", "Full name of the token (e.g., 'Apple Inc Stock')")
  .addParam("tokensymbol", "Symbol of the token (e.g., 'AAPL')")
  .addParam("price", "Initial price of the stock")
  .setDescription("Create a new stock token")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { stockname, tokenname, tokensymbol, price } = taskArguments;
    const [signer] = await ethers.getSigners();

    const factoryDeployment = await deployments.get("StockTradingFactory");
    const factory = await ethers.getContractAt("StockTradingFactory", factoryDeployment.address);

    console.log(`Creating stock token: ${stockname} (${tokensymbol}) with initial price: ${price}`);

    const tx = await factory.connect(signer).createStockToken(
      stockname,
      tokenname, 
      tokensymbol,
      (price)*1000000
    );

    await tx.wait();
    
    const tokenAddress = await factory.getStockToken(stockname);
    console.log(`Stock token created successfully!`);
    console.log(`Token address: ${tokenAddress}`);
  });

task("stock:mint")
  .addParam("stockname", "Name of the stock")
  .addParam("to", "Address to mint tokens to")
  .addParam("amount", "Amount of tokens to mint")
  .setDescription("Mint stock tokens to an address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { stockname, to, amount } = taskArguments;
    const [signer] = await ethers.getSigners();

    const factoryDeployment = await deployments.get("StockTradingFactory");
    const factory = await ethers.getContractAt("StockTradingFactory", factoryDeployment.address);

    console.log(`Minting ${amount} tokens of ${stockname} to ${to}`);

    const tx = await factory.connect(signer).mintStockTokens(stockname, to, amount);
    await tx.wait();

    console.log(`Successfully minted ${amount} tokens of ${stockname} to ${to}`);
  });

task("stock:mint-encrypted")
  .addParam("stockname", "Name of the stock")
  .addParam("to", "Address to mint tokens to")
  .addParam("amount", "Amount of tokens to mint")
  .setDescription("Mint encrypted stock tokens to an address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { fhevm } = await import("hardhat");
    const { stockname, to, amount } = taskArguments;
    const [signer] = await ethers.getSigners();

    const factoryDeployment = await deployments.get("StockTradingFactory");
    const factory = await ethers.getContractAt("StockTradingFactory", factoryDeployment.address);

    const tokenAddress = await factory.getStockToken(stockname);
    
    console.log(`Creating encrypted input for ${amount} tokens`);
    
    const input = fhevm.createEncryptedInput(factory.target, signer.address);
    input.add64(BigInt(amount));
    const encryptedInput = await input.encrypt();

    console.log(`Minting encrypted ${amount} tokens of ${stockname} to ${to}`);

    const tx = await factory.connect(signer).mintStockTokens(
      stockname,
      to,
      encryptedInput.handles[0],
      encryptedInput.inputProof
    );
    await tx.wait();

    console.log(`Successfully minted encrypted ${amount} tokens of ${stockname} to ${to}`);
  });

task("stock:balance")
  .addParam("stockname", "Name of the stock")
  .addParam("account", "Account address to check balance")
  .setDescription("Get encrypted balance of a stock token")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { stockname, account } = taskArguments;
    const [signer] = await ethers.getSigners();

    const factoryDeployment = await deployments.get("StockTradingFactory");
    const factory = await ethers.getContractAt("StockTradingFactory", factoryDeployment.address);

    const tokenAddress = await factory.getStockToken(stockname);
    const stockToken = await ethers.getContractAt("StockToken", tokenAddress);

    console.log(`Getting balance of ${stockname} for ${account}`);

    const encryptedBalance = await stockToken.connect(signer).confidentialBalanceOf(account);
    console.log(`Encrypted balance handle: ${encryptedBalance}`);

    // For decryption, user would need to use the frontend with proper permissions
    console.log("Note: To decrypt this balance, use the frontend application with proper ACL permissions");
  });

task("stock:info")
  .addParam("stockname", "Name of the stock")
  .setDescription("Get stock token information")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { stockname } = taskArguments;

    const factoryDeployment = await deployments.get("StockTradingFactory");
    const factory = await ethers.getContractAt("StockTradingFactory", factoryDeployment.address);

    console.log(`Getting information for stock: ${stockname}`);

    try {
      const [name, price, tokenAddress] = await factory.getStockInfo(stockname);
      console.log(`Stock Name: ${name}`);
      console.log(`Current Price: ${ethers.formatEther(price)} ETH`);
      console.log(`Token Address: ${tokenAddress}`);
    } catch (error) {
      console.log(`Stock ${stockname} not found`);
    }
  });

task("stock:list")
  .setDescription("List all created stocks")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const factoryDeployment = await deployments.get("StockTradingFactory");
    const factory = await ethers.getContractAt("StockTradingFactory", factoryDeployment.address);

    console.log("Listing all created stocks:");

    const stockNames = await factory.getAllStockNames();
    
    if (stockNames.length === 0) {
      console.log("No stocks created yet.");
      return;
    }

    for (let i = 0; i < stockNames.length; i++) {
      const stockName = stockNames[i];
      const [name, price, tokenAddress] = await factory.getStockInfo(stockName);
      console.log(`${i + 1}. ${name} (${stockName})`);
      console.log(`   Price: ${ethers.formatEther(price)} ETH`);
      console.log(`   Address: ${tokenAddress}`);
      console.log("");
    }
  });

task("stock:update-price")
  .addParam("stockname", "Name of the stock")
  .addParam("price", "New price of the stock")
  .setDescription("Update the price of a stock")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { stockname, price } = taskArguments;
    const [signer] = await ethers.getSigners();

    const factoryDeployment = await deployments.get("StockTradingFactory");
    const factory = await ethers.getContractAt("StockTradingFactory", factoryDeployment.address);

    console.log(`Updating price of ${stockname} to ${price} ETH`);

    const tx = await factory.connect(signer).updateStockPrice(stockname, ethers.parseEther(price));
    await tx.wait();

    console.log(`Successfully updated price of ${stockname} to ${price} ETH`);
  });

task("stock:create-popular")
  .setDescription("Create 5 popular stock tokens (AAPL, TSLA, GOOGL, MSFT, AMZN)")
  .setAction(async function (_taskArguments: TaskArguments, { ethers, deployments }) {
    const [signer] = await ethers.getSigners();

    const factoryDeployment = await deployments.get("StockTradingFactory");
    const factory = await ethers.getContractAt("StockTradingFactory", factoryDeployment.address);

    const stocks = [
      {
        stockname: "AAPL",
        tokenname: "Apple Inc Stock",
        tokensymbol: "AAPL",
        price: 150.25
      },
      {
        stockname: "TSLA",
        tokenname: "Tesla Inc Stock",
        tokensymbol: "TSLA",
        price: 242.84
      },
      {
        stockname: "GOOGL",
        tokenname: "Alphabet Inc Stock",
        tokensymbol: "GOOGL",
        price: 138.21
      },
      {
        stockname: "MSFT",
        tokenname: "Microsoft Corporation Stock",
        tokensymbol: "MSFT",
        price: 378.85
      },
      {
        stockname: "AMZN",
        tokenname: "Amazon.com Inc Stock",
        tokensymbol: "AMZN",
        price: 144.05
      }
    ];

    console.log("Creating 5 popular stock tokens...\n");

    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];

      console.log(`${i + 1}/5 Creating ${stock.stockname} (${stock.tokenname}) with price: $${stock.price}`);

      try {
        const tx = await factory.connect(signer).createStockToken(
          stock.stockname,
          stock.tokenname,
          stock.tokensymbol,
          Math.floor(stock.price * 1000000) // Convert to wei with 6 decimal precision
        );

        await tx.wait();

        const tokenAddress = await factory.getStockToken(stock.stockname);
        console.log(`✅ ${stock.stockname} created successfully! Address: ${tokenAddress}`);

      } catch (error: any) {
        console.log(`❌ Failed to create ${stock.stockname}: ${error.message}`);
      }

      console.log("");
    }

    console.log("All stock tokens creation completed!");
    console.log("You can now use 'npx hardhat stock:list --network sepolia' to see all created stocks.");
  });