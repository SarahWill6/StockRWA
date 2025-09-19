import { useState } from 'react';
import { ethers } from 'ethers';
import type{ Stock } from '../type';
import { useAccount } from 'wagmi';
import {
  STOCK_TOKEN_ABI,
} from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';

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
  const { instance: zamaInstance } = useZamaInstance();
  const signerPromise = useEthersSigner();

  const handleTransfer = async () => {
    if (!selectedStock || !isConnected || !amount || !recipient) {
      setMessage('Please fill all fields and select a stock');
      return;
    }

    if (!zamaInstance || !signerPromise) {
      setMessage('FHE SDK not ready. Please try again in a moment.');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0) {
      setMessage('Amount must be greater than 0');
      return;
    }

    // Validate recipient address
    if (!ethers.isAddress(recipient)) {
      setMessage('Invalid recipient address');
      return;
    }

    try {
      setLoading(true);
      setMessage('Preparing encrypted transfer...');

      // Get the signer
      const signer = await signerPromise;
      if (!signer) {
        throw new Error('Failed to get wallet signer');
      }

      // Convert amount to 6-decimal precision (multiply by 1,000,000)
      const amountInUnits = Math.floor(transferAmount * 1000000);

      // Create encrypted input for the transfer amount
      const input = zamaInstance.createEncryptedInput(
        selectedStock.tokenAddress,
        userAddress
      );
      input.add64(amountInUnits);
      const encryptedInput = await input.encrypt();

      setMessage('Encrypted input created. Initiating transfer...');

      // Create stock token contract instance
      const stockToken = new ethers.Contract(
        selectedStock.tokenAddress,
        STOCK_TOKEN_ABI,
        signer
      );

      console.log('Transferring encrypted amount:', {
        from: userAddress,
        to: recipient,
        amount: amountInUnits,
        encryptedHandle: encryptedInput.handles[0]
      });

      // Call the encrypted transfer function
      const tx = await stockToken.confidentialTransfer(
        recipient,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      setMessage('Transaction submitted. Waiting for confirmation...');

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      console.log('Transfer completed:', receipt);
      setMessage(`✅Successfully transferred ${amount} ${selectedStock.symbol} to ${recipient}`);

      // Reset form
      setAmount('');
      setRecipient('');

      // Refresh the parent component after 3 seconds
      setTimeout(() => {
        onTradeComplete();
        setMessage('');
      }, 3000);

    } catch (error: any) {
      console.error('Transfer failed:', error);
      let errorMessage = 'Transfer failed';

      if (error?.reason) {
        errorMessage += `: ${error.reason}`;
      } else if (error?.message) {
        if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas or tokens';
        } else {
          errorMessage += `: ${error.message}`;
        }
      }

      setMessage(`❌ ${errorMessage}`);
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
          disabled={loading || !amount || !recipient || !zamaInstance || !signerPromise}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: loading || !amount || !recipient || !zamaInstance || !signerPromise ? '#d1d5db' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: loading || !amount || !recipient || !zamaInstance || !signerPromise ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            marginTop: '0.5rem'
          }}
          onMouseEnter={(e) => {
            if (!loading && amount && recipient && zamaInstance && signerPromise) {
              e.currentTarget.style.backgroundColor = '#059669';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && amount && recipient && zamaInstance && signerPromise) {
              e.currentTarget.style.backgroundColor = '#10b981';
            }
          }}
        >
          {loading ? 'Processing...' : `🔒 Encrypted Transfer ${selectedStock.symbol}`}
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
            fontSize: '0.875rem'
          }}>
            {message}
          </div>
        )}

        {/* FHE Integration Info */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#ecfdf5',
          border: '1px solid #bbf7d0',
          borderRadius: '6px',
          fontSize: '0.875rem',
          color: '#166534',
          marginTop: '1rem'
        }}>
          <strong>🔐 FHE Encrypted Transfer:</strong>
          <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '1rem' }}>
            <li>Transfer amounts are encrypted using Zama's FHE technology</li>
            <li>Only the sender and recipient can decrypt their balances</li>
            <li>Transaction amounts remain private on the blockchain</li>
            <li>Uses 6-decimal precision for token amounts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}