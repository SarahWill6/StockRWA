// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {StockToken} from "./StockToken.sol";
import {externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract StockTradingFactory is SepoliaConfig {
    mapping(string stockName => address tokenAddress) public stockTokens;
    mapping(address tokenAddress => string stockName) public tokenToStockName;
    string[] public stockNames;
    address public owner;
    
    event StockTokenCreated(string indexed stockName, address indexed tokenAddress, uint256 initialPrice);
    event StockTraded(address indexed token, address indexed from, address indexed to);
    
    error OnlyOwnerAllowed();
    error StockAlreadyExists();
    error StockNotFound();
    error InvalidPrice();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwnerAllowed();
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function createStockToken(
        string memory stockName,
        string memory tokenName,
        string memory tokenSymbol,
        uint256 initialPrice
    ) external onlyOwner returns (address) {
        if (stockTokens[stockName] != address(0)) revert StockAlreadyExists();
        if (initialPrice == 0) revert InvalidPrice();
        
        StockToken newStockToken = new StockToken(
            stockName,
            tokenName,
            tokenSymbol,
            initialPrice,
            address(this)
        );
        
        address tokenAddress = address(newStockToken);
        stockTokens[stockName] = tokenAddress;
        tokenToStockName[tokenAddress] = stockName;
        stockNames.push(stockName);
        
        emit StockTokenCreated(stockName, tokenAddress, initialPrice);
        return tokenAddress;
    }
    
    function getStockToken(string memory stockName) external view returns (address) {
        address tokenAddress = stockTokens[stockName];
        if (tokenAddress == address(0)) revert StockNotFound();
        return tokenAddress;
    }
    
    function updateStockPrice(string memory stockName, uint256 newPrice) external onlyOwner {
        address tokenAddress = stockTokens[stockName];
        if (tokenAddress == address(0)) revert StockNotFound();
        if (newPrice == 0) revert InvalidPrice();
        
        StockToken(tokenAddress).updatePrice(newPrice);
    }
    
    function mintStockTokens(string memory stockName, address to, uint64 amount) external onlyOwner {
        address tokenAddress = stockTokens[stockName];
        if (tokenAddress == address(0)) revert StockNotFound();
        
        StockToken(tokenAddress).mintStock(to, amount);
    }
    
    function mintStockTokens(
        string memory stockName, 
        address to, 
        externalEuint64 encryptedAmount, 
        bytes calldata inputProof
    ) external onlyOwner {
        address tokenAddress = stockTokens[stockName];
        if (tokenAddress == address(0)) revert StockNotFound();
        
        StockToken(tokenAddress).mintStock(to, encryptedAmount, inputProof);
    }
    
    function getAllStockNames() external view returns (string[] memory) {
        return stockNames;
    }
    
    function getStockCount() external view returns (uint256) {
        return stockNames.length;
    }
    
    function getStockInfo(string memory stockName) external view returns (string memory, uint256, address) {
        address tokenAddress = stockTokens[stockName];
        if (tokenAddress == address(0)) revert StockNotFound();
        
        return StockToken(tokenAddress).getStockInfo();
    }
    
    error InvalidAddress();
    
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        owner = newOwner;
    }
}