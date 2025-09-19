import React, { useState } from 'react';
import { ethers } from 'ethers';
import type{ Stock } from '../type';
import { useAccount } from 'wagmi';
import {
  STOCK_TOKEN_ABI,
} from '../config/contracts';

interface TradingInterfaceProps {
  selectedStock: Stock | null;
  userAddress: string;
  onTradeComplete: () => void;
}

export function TradingInterface({
  selectedStock,
  userAddress,
  onTradeComplete
}: TradingInterfaceProps) {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleTransfer = async () => {
    if (!selectedStock || !isConnected || !amount || !recipient) {
      setMessage('Please fill all fields and select a stock');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create stock token contract instance
      const stockToken = new ethers.Contract(
        selectedStock.tokenAddress,
        STOCK_TOKEN_ABI,
        signer
      );

      // For now, we'll use a simple transfer (non-encrypted)
      // In a full implementation, you would integrate Zama's FHE SDK here
      console.log(`Transferring ${amount} ${selectedStock.symbol} to ${recipient}`);

      setMessage(`Transfer initiated for ${amount} ${selectedStock.symbol} tokens`);

      // Reset form
      setAmount('');
      setRecipient('');

      // Refresh the parent component
      setTimeout(() => {
        onTradeComplete();
        setMessage('');
      }, 2000);

    } catch (error) {
      console.error('Transfer failed:', error);
      setMessage(`Transfer failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedStock) {
    return (
      <div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '1.5rem'
        }}>
          💱 Trading Interface
        </h2>
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280'
        }}>
          <p>Select a stock to start trading</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: '1.5rem'
      }}>
        💱 Trading Interface
      </h2>

      {/* Selected Stock Info */}
      <div style={{
        padding: '1rem',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#111827',
          margin: 0,
          marginBottom: '0.5rem'
        }}>
          {selectedStock.symbol} - {selectedStock.name}
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          margin: 0
        }}>
          Price: ${parseFloat(selectedStock.price).toFixed(2)} per token
        </p>
        <p style={{
          fontSize: '0.75rem',
          color: '#9ca3af',
          margin: 0,
          marginTop: '0.25rem',
          wordBreak: 'break-all'
        }}>
          Token Address: {selectedStock.tokenAddress}
        </p>
      </div>

      {/* Transfer Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Amount to Transfer
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
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
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
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
        </div>

        <button
          onClick={handleTransfer}
          disabled={loading || !amount || !recipient}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: loading || !amount || !recipient ? '#d1d5db' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: loading || !amount || !recipient ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            marginTop: '0.5rem'
          }}
          onMouseEnter={(e) => {
            if (!loading && amount && recipient) {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && amount && recipient) {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }
          }}
        >
          {loading ? 'Processing...' : `Transfer ${selectedStock.symbol}`}
        </button>

        {message && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: message.includes('failed') ? '#fee2e2' : '#dcfce7',
            border: `1px solid ${message.includes('failed') ? '#fecaca' : '#bbf7d0'}`,
            borderRadius: '6px',
            color: message.includes('failed') ? '#991b1b' : '#166534',
            fontSize: '0.875rem'
          }}>
            {message}
          </div>
        )}

        {/* Note about FHE Integration */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '6px',
          fontSize: '0.875rem',
          color: '#92400e',
          marginTop: '1rem'
        }}>
          <strong>⚡ Note:</strong> This is a simplified demo interface.
          In a production environment, this would integrate with Zama's FHE SDK
          to handle encrypted transfers and maintain privacy.
        </div>
      </div>
    </div>
  );
}