import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import {
  STOCK_TRADING_FACTORY_ADDRESS,
  STOCK_TRADING_FACTORY_ABI
} from '../config/contracts';

interface StockCreationFormProps {
  onStockCreated: () => void;
}

export function StockCreationForm({ onStockCreated }: StockCreationFormProps) {
  const { isConnected } = useAccount();
  const [stockName, setStockName] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [initialPrice, setInitialPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateStock = async () => {
    if (!isConnected || !stockName || !tokenName || !tokenSymbol || !initialPrice) {
      setMessage('Please fill all fields');
      return;
    }

    if (parseFloat(initialPrice) <= 0) {
      setMessage('Initial price must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create factory contract instance
      const factory = new ethers.Contract(
        STOCK_TRADING_FACTORY_ADDRESS,
        STOCK_TRADING_FACTORY_ABI,
        signer
      );

      // Convert price to wei (assuming 18 decimals)
      const priceInWei = ethers.parseEther(initialPrice);

      console.log('Creating stock token:', {
        stockName,
        tokenName,
        tokenSymbol,
        initialPrice: priceInWei.toString()
      });

      // Call the createStockToken function
      const tx = await factory.createStockToken(
        stockName,
        tokenName,
        tokenSymbol,
        priceInWei
      );

      setMessage('Transaction submitted. Waiting for confirmation...');

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      console.log('Stock token created successfully:', receipt);
      setMessage(`Stock token "${stockName}" created successfully!`);

      // Reset form
      setStockName('');
      setTokenName('');
      setTokenSymbol('');
      setInitialPrice('');

      // Refresh the parent component
      setTimeout(() => {
        onStockCreated();
        setMessage('');
      }, 3000);

    } catch (error) {
      console.error('Stock creation failed:', error);
      let errorMessage = 'Stock creation failed';

      if (error.reason) {
        errorMessage += `: ${error.reason}`;
      } else if (error.message) {
        if (error.message.includes('StockAlreadyExists')) {
          errorMessage = 'A stock with this name already exists';
        } else if (error.message.includes('OnlyOwnerAllowed')) {
          errorMessage = 'Only the contract owner can create stock tokens';
        } else {
          errorMessage += `: ${error.message}`;
        }
      }

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolChange = (value: string) => {
    // Auto-generate symbol from stock name if not manually set
    setTokenSymbol(value.toUpperCase());
  };

  const handleStockNameChange = (value: string) => {
    setStockName(value);
    // Auto-generate token name and symbol if they're empty
    if (!tokenName) {
      setTokenName(`${value} Token`);
    }
    if (!tokenSymbol) {
      setTokenSymbol(value.toUpperCase().replace(/\s+/g, '').slice(0, 6));
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
        🏭 Create New Stock Token
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Stock Name *
          </label>
          <input
            type="text"
            value={stockName}
            onChange={(e) => handleStockNameChange(e.target.value)}
            placeholder="e.g., Apple Inc"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
          />
          <p style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            margin: '0.25rem 0 0 0'
          }}>
            The name of the stock (e.g., "Apple Inc", "Tesla")
          </p>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Token Name *
          </label>
          <input
            type="text"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="e.g., Apple Inc Token"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
          />
          <p style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            margin: '0.25rem 0 0 0'
          }}>
            The full name of the ERC20 token
          </p>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Token Symbol *
          </label>
          <input
            type="text"
            value={tokenSymbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            placeholder="e.g., AAPL"
            maxLength={10}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              boxSizing: 'border-box'
            }}
          />
          <p style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            margin: '0.25rem 0 0 0'
          }}>
            The symbol for the token (max 10 characters, auto-converted to uppercase)
          </p>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Initial Price (ETH) *
          </label>
          <input
            type="number"
            value={initialPrice}
            onChange={(e) => setInitialPrice(e.target.value)}
            placeholder="e.g., 0.001"
            step="0.001"
            min="0.000001"
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
            The initial price per token in ETH
          </p>
        </div>

        <button
          onClick={handleCreateStock}
          disabled={loading || !stockName || !tokenName || !tokenSymbol || !initialPrice || !isConnected}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: loading || !stockName || !tokenName || !tokenSymbol || !initialPrice || !isConnected ? '#d1d5db' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: loading || !stockName || !tokenName || !tokenSymbol || !initialPrice || !isConnected ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            marginTop: '0.5rem'
          }}
          onMouseEnter={(e) => {
            if (!loading && stockName && tokenName && tokenSymbol && initialPrice && isConnected) {
              e.currentTarget.style.backgroundColor = '#059669';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && stockName && tokenName && tokenSymbol && initialPrice && isConnected) {
              e.currentTarget.style.backgroundColor = '#10b981';
            }
          }}
        >
          {loading ? 'Creating Stock Token...' : 'Create Stock Token'}
        </button>

        {message && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: message.includes('failed') || message.includes('error') ? '#fee2e2' :
                             message.includes('successfully') ? '#dcfce7' : '#dbeafe',
            border: `1px solid ${message.includes('failed') || message.includes('error') ? '#fecaca' :
                                  message.includes('successfully') ? '#bbf7d0' : '#bfdbfe'}`,
            borderRadius: '6px',
            color: message.includes('failed') || message.includes('error') ? '#991b1b' :
                   message.includes('successfully') ? '#166534' : '#1e40af',
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
            <strong>⚠️ Note:</strong> Please connect your wallet to create stock tokens.
          </div>
        )}

        {/* Information about requirements */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
          fontSize: '0.875rem',
          color: '#0c4a6e',
          marginTop: '1rem'
        }}>
          <strong>📋 Requirements:</strong>
          <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '1rem' }}>
            <li>Only the contract owner can create new stock tokens</li>
            <li>Stock names must be unique</li>
            <li>All fields are required</li>
            <li>Initial price must be greater than 0</li>
          </ul>
        </div>
      </div>
    </div>
  );
}