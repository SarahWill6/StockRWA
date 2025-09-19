import { expect } from "chai";
import { ethers } from "hardhat";
import type { StockTradingFactory, StockToken, StockTrading } from "../types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";

describe("StockTrading", function () {
  let stockTradingFactory: StockTradingFactory;
  let stockTrading: StockTrading;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy StockTradingFactory
    const StockTradingFactoryFactory = await ethers.getContractFactory("StockTradingFactory");
    stockTradingFactory = await StockTradingFactoryFactory.deploy();
    await stockTradingFactory.waitForDeployment();

    // Deploy StockTrading
    const StockTradingContractFactory = await ethers.getContractFactory("StockTrading");
    stockTrading = await StockTradingContractFactory.deploy(await stockTradingFactory.getAddress());
    await stockTrading.waitForDeployment();
  });

  describe("StockTradingFactory", function () {
    it("Should create a new stock token", async function () {
      const stockName = "AAPL";
      const tokenName = "Apple Inc Stock";
      const tokenSymbol = "AAPL";
      const initialPrice = ethers.parseEther("150");

      await stockTradingFactory.createStockToken(stockName, tokenName, tokenSymbol, initialPrice);

      const tokenAddress = await stockTradingFactory.getStockToken(stockName);
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);

      const stockNames = await stockTradingFactory.getAllStockNames();
      expect(stockNames).to.include(stockName);
    });

    it("Should prevent duplicate stock creation", async function () {
      const stockName = "AAPL";
      const tokenName = "Apple Inc Stock";
      const tokenSymbol = "AAPL";
      const initialPrice = ethers.parseEther("150");

      await stockTradingFactory.createStockToken(stockName, tokenName, tokenSymbol, initialPrice);

      await expect(
        stockTradingFactory.createStockToken(stockName, tokenName, tokenSymbol, initialPrice)
      ).to.be.revertedWithCustomError(stockTradingFactory, "StockAlreadyExists");
    });

    it("Should update stock price", async function () {
      const stockName = "AAPL";
      const tokenName = "Apple Inc Stock";
      const tokenSymbol = "AAPL";
      const initialPrice = ethers.parseEther("150");
      const newPrice = ethers.parseEther("160");

      await stockTradingFactory.createStockToken(stockName, tokenName, tokenSymbol, initialPrice);
      await stockTradingFactory.updateStockPrice(stockName, newPrice);

      const [, price] = await stockTradingFactory.getStockInfo(stockName);
      expect(price).to.equal(newPrice);
    });

    it("Should mint stock tokens", async function () {
      const stockName = "AAPL";
      const tokenName = "Apple Inc Stock";
      const tokenSymbol = "AAPL";
      const initialPrice = ethers.parseEther("150");
      const mintAmount = 100;

      await stockTradingFactory.createStockToken(stockName, tokenName, tokenSymbol, initialPrice);
      await stockTradingFactory.mintStockTokens(stockName, user1.address, mintAmount);

      const tokenAddress = await stockTradingFactory.getStockToken(stockName);
      const stockToken = await ethers.getContractAt("StockToken", tokenAddress);

      // Note: Balance will be encrypted, so we can only verify it exists
      const encryptedBalance = await stockToken.confidentialBalanceOf(user1.address);
      expect(encryptedBalance).to.not.equal("0x");
    });

    it("Should only allow owner to create stocks", async function () {
      const stockName = "AAPL";
      const tokenName = "Apple Inc Stock";
      const tokenSymbol = "AAPL";
      const initialPrice = ethers.parseEther("150");

      await expect(
        stockTradingFactory.connect(user1).createStockToken(stockName, tokenName, tokenSymbol, initialPrice)
      ).to.be.revertedWithCustomError(stockTradingFactory, "OnlyOwnerAllowed");
    });

    it("Should get stock information", async function () {
      const stockName = "AAPL";
      const tokenName = "Apple Inc Stock";
      const tokenSymbol = "AAPL";
      const initialPrice = ethers.parseEther("150");

      await stockTradingFactory.createStockToken(stockName, tokenName, tokenSymbol, initialPrice);

      const [name, price, tokenAddress] = await stockTradingFactory.getStockInfo(stockName);
      expect(name).to.equal(stockName);
      expect(price).to.equal(initialPrice);
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should transfer ownership", async function () {
      await stockTradingFactory.transferOwnership(user1.address);
      expect(await stockTradingFactory.owner()).to.equal(user1.address);
    });
  });

  describe("StockToken", function () {
    let stockToken: StockToken;
    const stockName = "AAPL";
    const tokenName = "Apple Inc Stock";
    const tokenSymbol = "AAPL";
    const initialPrice = ethers.parseEther("150");

    beforeEach(async function () {
      await stockTradingFactory.createStockToken(stockName, tokenName, tokenSymbol, initialPrice);
      const tokenAddress = await stockTradingFactory.getStockToken(stockName);
      stockToken = await ethers.getContractAt("StockToken", tokenAddress);
    });

    it("Should have correct stock information", async function () {
      expect(await stockToken.stockName()).to.equal(stockName);
      expect(await stockToken.name()).to.equal(tokenName);
      expect(await stockToken.symbol()).to.equal(tokenSymbol);
      expect(await stockToken.currentPrice()).to.equal(initialPrice);
    });

    it("Should only allow factory to mint tokens", async function () {
      await expect(
        stockToken.connect(user1).mintStock(user1.address, 100)
      ).to.be.revertedWithCustomError(stockToken, "OnlyFactoryAllowed");
    });

    it("Should only allow factory to update price", async function () {
      const newPrice = ethers.parseEther("160");
      await expect(
        stockToken.connect(user1).updatePrice(newPrice)
      ).to.be.revertedWithCustomError(stockToken, "OnlyFactoryAllowed");
    });
  });

  describe("StockTrading Orders", function () {
    const stockName = "AAPL";
    const tokenName = "Apple Inc Stock";
    const tokenSymbol = "AAPL";
    const initialPrice = ethers.parseEther("150");

    beforeEach(async function () {
      await stockTradingFactory.createStockToken(stockName, tokenName, tokenSymbol, initialPrice);
      await stockTradingFactory.mintStockTokens(stockName, user1.address, 1000);
    });

    it("Should get FACTORY address", async function () {
      const factoryAddress = await stockTrading.FACTORY();
      expect(factoryAddress).to.equal(await stockTradingFactory.getAddress());
    });

    it("Should get order counter", async function () {
      const counter = await stockTrading.orderCounter();
      expect(counter).to.equal(0);
    });

    it("Should have correct ORDER_EXPIRY", async function () {
      const expiry = await stockTrading.ORDER_EXPIRY();
      expect(expiry).to.equal(24 * 60 * 60); // 24 hours in seconds
    });
  });
});