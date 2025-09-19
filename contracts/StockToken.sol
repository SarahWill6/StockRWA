// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ConfidentialFungibleToken} from "new-confidential-contracts/token/ConfidentialFungibleToken.sol";
import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract StockToken is ConfidentialFungibleToken, SepoliaConfig {
    string public stockName;
    uint256 public currentPrice;
    address public stockFactory;

    event PriceUpdated(uint256 newPrice);
    event StockMinted(address indexed to, uint256 publicAmount);

    error OnlyFactoryAllowed();

    modifier onlyFactory() {
        if (msg.sender != stockFactory) revert OnlyFactoryAllowed();
        _;
    }

    constructor(
        string memory _stockName,
        string memory _name,
        string memory _symbol,
        uint256 _initialPrice,
        address _stockFactory
    ) ConfidentialFungibleToken(_name, _symbol, "") {
        stockName = _stockName;
        currentPrice = _initialPrice;
        stockFactory = _stockFactory;
    }

    function updatePrice(uint256 _newPrice) external onlyFactory {
        currentPrice = _newPrice;
        emit PriceUpdated(_newPrice);
    }

    function mintStock(address to, uint64 amount) external onlyFactory {
        euint64 encryptedAmount = FHE.asEuint64(amount);
        _mint(to, encryptedAmount);
        emit StockMinted(to, amount);
    }

    function mintStock(address to, externalEuint64 encryptedAmount, bytes calldata inputProof) external onlyFactory {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        _mint(to, amount);
    }

    function getStockInfo() external view returns (string memory, uint256, address) {
        return (stockName, currentPrice, address(this));
    }
}
