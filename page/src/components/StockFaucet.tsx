import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import type { Stock } from '../type';
import {
  STOCK_TOKEN_ABI,
  STOCK_TRADING_FACTORY_ADDRESS,
  STOCK_TRADING_FACTORY_ABI
} from '../config/contracts';

interface StockFaucetProps {
  stocks: Stock[];
  onMintComplete: () => void;
}

export function StockFaucet({ stocks, onMintComplete }: StockFaucetProps) {
  const { address, isConnected } = useAccount();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [mintAmount, setMintAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMintTokens = async () => {
    if (!selectedStock || !isConnected || !address || !mintAmount) {
      setMessage('Please select a stock and enter amount');
      return;
    }

    const amount = parseInt(mintAmount)*1000000;

    try {
      setLoading(true);
      setMessage('');

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create stock factory contract instance
      const stockFactory = new ethers.Contract(
        STOCK_TRADING_FACTORY_ADDRESS,
        STOCK_TRADING_FACTORY_ABI,
        signer
      );

      console.log('Minting tokens:', {
        stock: selectedStock.name,
        stockName: selectedStock.name,
        recipient: address,
        amount: amount
      });

      // Call the mintStockTokens function
      const tx = await stockFactory.mintStockTokens(selectedStock.name, address, amount);

      setMessage('Transaction submitted. Waiting for confirmation...');

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      console.log('Tokens minted successfully:', receipt);
      setMessage(`Successfully minted ${amount} ${selectedStock.symbol} tokens!`);

      // Reset form
      setMintAmount('100');

      // Refresh the parent component
      setTimeout(() => {
        onMintComplete();
        setMessage('');
      }, 3000);

    } catch (error: any) {
      console.error('Minting failed:', error);
      let errorMessage = 'Minting failed';

      if (error?.reason) {
        errorMessage += `: ${error.reason}`;
      } else if (error?.message) {
        if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        } else {
          errorMessage += `: ${error.message}`;
        }
      }

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: '1.5rem'
      }}>
        🚰 Stock Token Faucet
      </h2>

      <div style={{
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        fontSize: '0.875rem',
        color: '#0c4a6e'
      }}>
        <p style={{ margin: 0, marginBottom: '0.5rem' }}>
          <strong>📋 Faucet Information:</strong>
        </p>
        <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
          <li>Get free stock tokens for testing</li>
          <li>Maximum 10,000 tokens per transaction</li>
          <li>Tokens are minted directly to your wallet</li>
          <li>No limits on number of requests</li>
        </ul>
      </div>

      {stocks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          color: '#6b7280'
        }}>
          <p>No stock tokens available. Create a stock token first!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Select Stock Token *
            </label>
            <select
              value={selectedStock?.tokenAddress || ''}
              onChange={(e) => {
                const stock = stocks.find(s => s.tokenAddress === e.target.value);
                setSelectedStock(stock || null);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                backgroundColor: 'white',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Choose a stock token...</option>
              {stocks.map((stock) => (
                <option key={stock.tokenAddress} value={stock.tokenAddress}>
                  {stock.symbol} - {stock.name} (${parseFloat(stock.price).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {selectedStock && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#111827',
                margin: 0,
                marginBottom: '0.5rem'
              }}>
                Selected: {selectedStock.symbol} - {selectedStock.name}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0,
                marginBottom: '0.25rem'
              }}>
                Current Price: ${parseFloat(selectedStock.price).toFixed(2)} per token
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                margin: 0,
                wordBreak: 'break-all'
              }}>
                Token Contract: {selectedStock.tokenAddress}
              </p>
            </div>
          )}

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Amount to Mint *
            </label>
            <input
              type="number"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder="100"
              min="1"
              max="10000"
              step="1"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: '0.25rem 0 0 0'
            }}>
              Enter number of tokens to mint (1 - 10,000)
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <p style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              margin: '0 0 0.5rem 0'
            }}>
              Quick amounts:
            </p>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {[100, 500, 1000, 5000, 10000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setMintAmount(amount.toString())}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: mintAmount === amount.toString() ? '#3b82f6' : '#f3f4f6',
                    color: mintAmount === amount.toString() ? 'white' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (mintAmount !== amount.toString()) {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (mintAmount !== amount.toString()) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  {amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleMintTokens}
            disabled={loading || !selectedStock || !mintAmount || !isConnected}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading || !selectedStock || !mintAmount || !isConnected ? '#d1d5db' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading || !selectedStock || !mintAmount || !isConnected ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!loading && selectedStock && mintAmount && isConnected) {
                e.currentTarget.style.backgroundColor = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && selectedStock && mintAmount && isConnected) {
                e.currentTarget.style.backgroundColor = '#10b981';
              }
            }}
          >
            {loading ? 'Minting Tokens...' : `Mint ${mintAmount} ${selectedStock?.symbol || 'Tokens'}`}
          </button>

          {message && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: message.includes('failed') || message.includes('error') || message.includes('rejected') ? '#fee2e2' :
                               message.includes('Successfully') ? '#dcfce7' : '#dbeafe',
              border: `1px solid ${message.includes('failed') || message.includes('error') || message.includes('rejected') ? '#fecaca' :
                                    message.includes('Successfully') ? '#bbf7d0' : '#bfdbfe'}`,
              borderRadius: '6px',
              color: message.includes('failed') || message.includes('error') || message.includes('rejected') ? '#991b1b' :
                     message.includes('Successfully') ? '#166534' : '#1e40af',
              fontSize: '0.875rem'
            }}>
              {message}
            </div>
          )}

          {!isConnected && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              color: '#92400e',
              fontSize: '0.875rem'
            }}>
              <strong>⚠️ Note:</strong> Please connect your wallet to use the faucet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}