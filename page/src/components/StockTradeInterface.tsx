import { useState } from 'react';
import { ethers } from 'ethers';
import type { Stock } from '../type';
import { useAccount } from 'wagmi';
import {
  STOCK_TOKEN_ABI,
  STOCK_TRADING_FACTORY_ADDRESS,
  STOCK_TRADING_FACTORY_ABI
} from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';

interface StockTradeInterfaceProps {
  stocks: Stock[];
  userAddress: string;
  onTradeComplete: () => void;
}

export function StockTradeInterface({
  stocks,
  userAddress,
  onTradeComplete
}: StockTradeInterfaceProps) {
  const { isConnected } = useAccount();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { instance: zamaInstance } = useZamaInstance();
  const signerPromise = useEthersSigner();

  const handleTrade = async () => {
    if (!selectedStock || !isConnected || !amount || !price) {
      setMessage('Please select a stock and fill all fields');
      return;
    }

    if (!zamaInstance || !signerPromise) {
      setMessage('FHE SDK not ready. Please try again in a moment.');
      return;
    }

    const tradeAmount = parseFloat(amount);
    const tradePrice = parseFloat(price);

    if (tradeAmount <= 0 || tradePrice <= 0) {
      setMessage('Amount and price must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setMessage(`Preparing ${tradeType} order...`);

      // Get the signer
      const signer = await signerPromise;
      if (!signer) {
        throw new Error('Failed to get wallet signer');
      }

      // Convert amount to 6-decimal precision (multiply by 1,000,000)
      const amountInUnits = Math.floor(tradeAmount * 1000000);
      const priceInUnits = Math.floor(tradePrice * 1000000);

      if (tradeType === 'buy') {
        // For buying, we need to pay ETH and receive stock tokens
        const totalCost = ethers.parseEther((tradeAmount * tradePrice).toFixed(6));

        // Create stock factory contract instance for minting
        const stockFactory = new ethers.Contract(
          STOCK_TRADING_FACTORY_ADDRESS,
          STOCK_TRADING_FACTORY_ABI,
          signer
        );

        setMessage('Executing buy order...');

        // For demo purposes, we'll use the non-encrypted mint function
        // In a real trading system, this would involve a proper order book
        const tx = await stockFactory.mintStockTokens(
          selectedStock.name,
          userAddress,
          amountInUnits
        );

        setMessage('Buy order submitted. Waiting for confirmation...');
        const receipt = await tx.wait();

        console.log('Buy order completed:', receipt);
        setMessage(`✅ Successfully bought ${amount} ${selectedStock.symbol} at $${price} each`);

      } else {
        // For selling, we transfer stock tokens (encrypted)
        // Create encrypted input for the sell amount
        const input = zamaInstance.createEncryptedInput(
          selectedStock.tokenAddress,
          userAddress
        );
        input.add64(amountInUnits);
        const encryptedInput = await input.encrypt();

        setMessage('Creating encrypted sell order...');

        // Create stock token contract instance
        const stockToken = new ethers.Contract(
          selectedStock.tokenAddress,
          STOCK_TOKEN_ABI,
          signer
        );

        // For demo purposes, we'll transfer to a mock market maker address
        // In a real system, this would go to an order book contract
        const marketMakerAddress = "0x0000000000000000000000000000000000000001";

        const tx = await stockToken.confidentialTransfer(
          marketMakerAddress,
          encryptedInput.handles[0],
          encryptedInput.inputProof
        );

        setMessage('Sell order submitted. Waiting for confirmation...');
        const receipt = await tx.wait();

        console.log('Sell order completed:', receipt);
        setMessage(`✅ Successfully sold ${amount} ${selectedStock.symbol} at $${price} each`);
      }

      // Reset form
      setAmount('');
      setPrice('');

      // Refresh the parent component after 3 seconds
      setTimeout(() => {
        onTradeComplete();
        setMessage('');
      }, 3000);

    } catch (error: any) {
      console.error('Trade failed:', error);
      let errorMessage = `${tradeType.charAt(0).toUpperCase() + tradeType.slice(1)} order failed`;

      if (error?.reason) {
        errorMessage += `: ${error.reason}`;
      } else if (error?.message) {
        if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction';
        } else {
          errorMessage += `: ${error.message}`;
        }
      }

      setMessage(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const tradeAmount = parseFloat(amount) || 0;
    const tradePrice = parseFloat(price) || 0;
    return (tradeAmount * tradePrice).toFixed(6);
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: '1.5rem'
      }}>
        📊 Stock Trading
      </h2>

      {/* Stock Selection */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px'
      }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '0.5rem'
        }}>
          Select Stock
        </label>
        <select
          value={selectedStock?.name || ''}
          onChange={(e) => {
            const stock = stocks.find(s => s.name === e.target.value);
            setSelectedStock(stock || null);
            if (stock) {
              setPrice(stock.price);
            }
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem',
            backgroundColor: 'white'
          }}
        >
          <option value="">Choose a stock...</option>
          {stocks.map((stock) => (
            <option key={stock.tokenAddress} value={stock.name}>
              {stock.symbol} - ${stock.price} per token
            </option>
          ))}
        </select>
      </div>

      {selectedStock && (
        <>
          {/* Trade Type Selection */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
          }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Trade Type
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setTradeType('buy')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: tradeType === 'buy' ? '#10b981' : 'white',
                  color: tradeType === 'buy' ? 'white' : '#374151',
                  border: `2px solid ${tradeType === 'buy' ? '#10b981' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🟢 Buy
              </button>
              <button
                onClick={() => setTradeType('sell')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: tradeType === 'sell' ? '#ef4444' : 'white',
                  color: tradeType === 'sell' ? 'white' : '#374151',
                  border: `2px solid ${tradeType === 'sell' ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🔴 Sell
              </button>
            </div>
          </div>

          {/* Trading Form */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                step="0.000001"
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Price per Token ($)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                step="0.000001"
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Order Summary */}
          {amount && price && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: tradeType === 'buy' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${tradeType === 'buy' ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: tradeType === 'buy' ? '#166534' : '#991b1b',
                margin: '0 0 0.5rem 0'
              }}>
                Order Summary
              </h3>
              <div style={{
                fontSize: '0.875rem',
                color: tradeType === 'buy' ? '#166534' : '#991b1b'
              }}>
                <p style={{ margin: '0.25rem 0' }}>
                  {tradeType === 'buy' ? 'Buying' : 'Selling'}: {amount} {selectedStock.symbol}
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  Price: ${price} per token
                </p>
                <p style={{ margin: '0.25rem 0', fontWeight: '600' }}>
                  Total: ${calculateTotal()}
                </p>
              </div>
            </div>
          )}

          {/* Trade Button */}
          <button
            onClick={handleTrade}
            disabled={loading || !amount || !price || !selectedStock || !zamaInstance || !signerPromise}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: loading || !amount || !price || !selectedStock || !zamaInstance || !signerPromise
                ? '#d1d5db'
                : tradeType === 'buy' ? '#10b981' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.125rem',
              fontWeight: '600',
              cursor: loading || !amount || !price || !selectedStock || !zamaInstance || !signerPromise
                ? 'not-allowed'
                : 'pointer',
              transition: 'background-color 0.2s',
              marginBottom: '1rem'
            }}
            onMouseEnter={(e) => {
              if (!loading && amount && price && selectedStock && zamaInstance && signerPromise) {
                e.currentTarget.style.backgroundColor = tradeType === 'buy' ? '#059669' : '#dc2626';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && amount && price && selectedStock && zamaInstance && signerPromise) {
                e.currentTarget.style.backgroundColor = tradeType === 'buy' ? '#10b981' : '#ef4444';
              }
            }}
          >
            {loading ? 'Processing...' : `${tradeType === 'buy' ? '🟢 Buy' : '🔴 Sell'} ${selectedStock.symbol}`}
          </button>

          {message && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: message.includes('❌') || message.includes('failed') ? '#fee2e2' :
                             message.includes('✅') || message.includes('Successfully') ? '#dcfce7' : '#dbeafe',
              border: `1px solid ${message.includes('❌') || message.includes('failed') ? '#fecaca' :
                                  message.includes('✅') || message.includes('Successfully') ? '#bbf7d0' : '#bfdbfe'}`,
              borderRadius: '6px',
              color: message.includes('❌') || message.includes('failed') ? '#991b1b' :
                     message.includes('✅') || message.includes('Successfully') ? '#166534' : '#1e40af',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              {message}
            </div>
          )}

          {/* Trading Info */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#0369a1'
          }}>
            <strong>📈 Trading Information:</strong>
            <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '1rem' }}>
              <li>Buy orders mint new tokens (demo functionality)</li>
              <li>Sell orders use encrypted transfers for privacy</li>
              <li>All amounts use 6-decimal precision</li>
              <li>Transactions are secured by Zama's FHE technology</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}