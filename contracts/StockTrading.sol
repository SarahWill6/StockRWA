// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {StockToken} from "./StockToken.sol";
import {StockTradingFactory} from "./StockTradingFactory.sol";
import {FHE, externalEuint64, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract StockTrading is SepoliaConfig {
    StockTradingFactory public immutable FACTORY;
    
    struct Order {
        address seller;
        string stockName;
        euint64 amount;
        uint256 pricePerToken;
        bool isActive;
        uint256 timestamp;
    }
    
    mapping(uint256 orderId => Order order) public orders;
    mapping(address user => uint256[] orderIds) public userOrders;
    uint256 public orderCounter;
    uint256 public constant ORDER_EXPIRY = 24 hours;
    
    event OrderCreated(uint256 indexed orderId, address indexed seller, string stockName, uint256 pricePerToken);
    event OrderFilled(uint256 indexed orderId, address indexed buyer, address indexed seller);
    event OrderCancelled(uint256 indexed orderId, address indexed seller);
    
    error OrderNotFound();
    error OrderExpired();
    error OrderNotActive();
    error OnlySellerCanCancel();
    error InsufficientPayment();
    error InvalidAmount();
    error StockNotFound();
    
    constructor(address _factory) {
        FACTORY = StockTradingFactory(_factory);
    }
    
    function createSellOrder(
        string memory stockName,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof,
        uint256 pricePerToken
    ) external returns (uint256) {
        address tokenAddress = FACTORY.getStockToken(stockName);
        if (tokenAddress == address(0)) revert StockNotFound();
        
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        
        orderCounter++;
        orders[orderCounter] = Order({
            seller: msg.sender,
            stockName: stockName,
            amount: amount,
            pricePerToken: pricePerToken,
            isActive: true,
            timestamp: block.timestamp
        });
        
        userOrders[msg.sender].push(orderCounter);
        
        // Grant permissions for the encrypted amount
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);
        
        emit OrderCreated(orderCounter, msg.sender, stockName, pricePerToken);
        return orderCounter;
    }
    
    function buyStock(uint256 orderId, externalEuint64 encryptedAmount, bytes calldata inputProof) external payable {
        Order storage order = orders[orderId];
        if (order.seller == address(0)) revert OrderNotFound();
        if (!order.isActive) revert OrderNotActive();
        if (block.timestamp > order.timestamp + ORDER_EXPIRY) revert OrderExpired();
        
        euint64 requestedAmount = FHE.fromExternal(encryptedAmount, inputProof);
        
        // Check if requested amount is less than or equal to available amount
        ebool canBuy = FHE.le(requestedAmount, order.amount);
        
        // Get the actual transfer amount (will be 0 if can't buy)
        euint64 transferAmount = FHE.select(canBuy, requestedAmount, FHE.asEuint64(0));
        
        // Check minimum payment required
        if (msg.value < order.pricePerToken) revert InsufficientPayment();
        
        address tokenAddress = FACTORY.getStockToken(order.stockName);
        StockToken stockToken = StockToken(tokenAddress);
        
        // Transfer tokens from seller to buyer
        FHE.allowTransient(transferAmount, tokenAddress);
        stockToken.confidentialTransferFrom(order.seller, msg.sender, transferAmount);
        
        // Update the order amount
        order.amount = FHE.sub(order.amount, transferAmount);
        
        // Grant permissions
        FHE.allowThis(order.amount);
        FHE.allow(order.amount, order.seller);
        FHE.allowTransient(transferAmount, msg.sender);
        
        // Send payment to seller (simplified - should calculate exact amount)
        payable(order.seller).transfer(order.pricePerToken);
        
        // Refund excess payment
        if (msg.value > order.pricePerToken) {
            payable(msg.sender).transfer(msg.value - order.pricePerToken);
        }
        
        emit OrderFilled(orderId, msg.sender, order.seller);
    }
    
    function cancelOrder(uint256 orderId) external {
        Order storage order = orders[orderId];
        if (order.seller == address(0)) revert OrderNotFound();
        if (order.seller != msg.sender) revert OnlySellerCanCancel();
        if (!order.isActive) revert OrderNotActive();
        
        order.isActive = false;
        
        emit OrderCancelled(orderId, msg.sender);
    }
    
    function getOrder(uint256 orderId) external view returns (
        address seller,
        string memory stockName,
        euint64 amount,
        uint256 pricePerToken,
        bool isActive,
        uint256 timestamp
    ) {
        Order memory order = orders[orderId];
        if (order.seller == address(0)) revert OrderNotFound();
        
        return (
            order.seller,
            order.stockName,
            order.amount,
            order.pricePerToken,
            order.isActive,
            order.timestamp
        );
    }
    
    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }
    
    function isOrderExpired(uint256 orderId) external view returns (bool) {
        Order memory order = orders[orderId];
        if (order.seller == address(0)) revert OrderNotFound();
        
        return block.timestamp > order.timestamp + ORDER_EXPIRY;
    }
}