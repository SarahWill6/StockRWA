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

      if (tradeType === 'buy') {
        // For buying, we need to pay ETH and receive stock tokens

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
    return (tradeAmount * tradePrice).toFixed(2);
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '200px',
        height: '200px',
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
        borderRadius: '50%',
        filter: 'blur(40px)'
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          background: 'linear-gradient(135deg, #22c55e 0%, #ef4444 100%)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          boxShadow: '0 6px 20px rgba(34, 197, 94, 0.3)'
        }}>
          📊
        </div>
        <div>
          <h2 style={{
            fontSize: '1.375rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #22c55e 0%, #ef4444 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Stock Trading
          </h2>
          <p style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            margin: 0,
            fontWeight: '500'
          }}>
            Confidential Trading with FHE Technology
          </p>
        </div>
      </div>

      {/* Stock Selection */}
      <div style={{
        marginBottom: '1.25rem',
        padding: '1.25rem',
        background: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        borderRadius: '12px',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}>
            🎯
          </div>
          <label style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            color: '#111827',
            margin: 0
          }}>
            Select Stock to Trade
          </label>
        </div>
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
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '0.875rem',
            backgroundColor: 'white',
            fontWeight: '500',
            boxSizing: 'border-box',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <option value="">Choose a stock to trade...</option>
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
            marginBottom: '1.25rem',
            padding: '1.25rem',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '12px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>
                ⚡
              </div>
              <label style={{
                fontSize: '0.875rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>
                Trade Type
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setTradeType('buy')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: tradeType === 'buy'
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'rgba(255, 255, 255, 0.9)',
                  color: tradeType === 'buy' ? 'white' : '#374151',
                  border: `2px solid ${tradeType === 'buy' ? '#22c55e' : 'rgba(229, 231, 235, 0.8)'}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: tradeType === 'buy'
                    ? '0 8px 25px rgba(34, 197, 94, 0.3)'
                    : '0 4px 15px rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textShadow: tradeType === 'buy' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (tradeType !== 'buy') {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.15)';
                    e.currentTarget.style.borderColor = '#22c55e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (tradeType !== 'buy') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
                  }
                }}
              >
                🟢 Buy Order
              </button>
              <button
                onClick={() => setTradeType('sell')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: tradeType === 'sell'
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'rgba(255, 255, 255, 0.9)',
                  color: tradeType === 'sell' ? 'white' : '#374151',
                  border: `2px solid ${tradeType === 'sell' ? '#ef4444' : 'rgba(229, 231, 235, 0.8)'}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: tradeType === 'sell'
                    ? '0 8px 25px rgba(239, 68, 68, 0.3)'
                    : '0 4px 15px rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textShadow: tradeType === 'sell' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (tradeType !== 'sell') {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.borderColor = '#ef4444';
                  }
                }}
                onMouseLeave={(e) => {
                  if (tradeType !== 'sell') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(229, 231, 235, 0.8)';
                  }
                }}
              >
                🔴 Sell Order
              </button>
            </div>
          </div>

          {/* Trading Form */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.25rem',
            padding: '1.25rem',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '12px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            zIndex: 1
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>
                  💯
                </div>
                <label style={{
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0
                }}>
                  Amount
                </label>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to trade"
                step="0.000001"
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  boxSizing: 'border-box',
                  backgroundColor: 'white',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>
                  💲
                </div>
                <label style={{
                  fontSize: '0.8125rem',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0
                }}>
                  Price per Token ($)
                </label>
              </div>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price per token"
                step="0.000001"
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  boxSizing: 'border-box',
                  backgroundColor: 'white',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Order Summary */}
          {amount && price && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '1.25rem',
              background: tradeType === 'buy'
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
              border: `2px solid ${tradeType === 'buy' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              borderRadius: '12px',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: tradeType === 'buy'
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  boxShadow: tradeType === 'buy'
                    ? '0 4px 15px rgba(34, 197, 94, 0.3)'
                    : '0 4px 15px rgba(239, 68, 68, 0.3)'
                }}>
                  {tradeType === 'buy' ? '📈' : '📉'}
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '800',
                  color: tradeType === 'buy' ? '#166534' : '#991b1b',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Order Summary
                </h3>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.875rem',
                color: tradeType === 'buy' ? '#166534' : '#991b1b'
              }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.8)'
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', opacity: 0.8 }}>
                    ACTION
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                    {tradeType === 'buy' ? '🟢 Buying' : '🔴 Selling'}
                  </div>
                </div>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.8)'
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', opacity: 0.8 }}>
                    AMOUNT
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                    {amount} {selectedStock.symbol}
                  </div>
                </div>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.8)'
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', opacity: 0.8 }}>
                    PRICE
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                    ${price}
                  </div>
                </div>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  border: '2px solid ' + (tradeType === 'buy' ? '#22c55e' : '#ef4444'),
                  boxShadow: tradeType === 'buy'
                    ? '0 4px 15px rgba(34, 197, 94, 0.2)'
                    : '0 4px 15px rgba(239, 68, 68, 0.2)'
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', opacity: 0.8 }}>
                    TOTAL VALUE
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                    ${calculateTotal()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trade Button */}
          <button
            onClick={handleTrade}
            disabled={loading || !amount || !price || !selectedStock || !zamaInstance || !signerPromise}
            style={{
              width: '100%',
              padding: '1.25rem',
              background: loading || !amount || !price || !selectedStock || !zamaInstance || !signerPromise
                ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)'
                : tradeType === 'buy'
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '800',
              cursor: loading || !amount || !price || !selectedStock || !zamaInstance || !signerPromise
                ? 'not-allowed'
                : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              marginBottom: '1.25rem',
              boxShadow: loading || !amount || !price || !selectedStock || !zamaInstance || !signerPromise
                ? 'none'
                : tradeType === 'buy'
                  ? '0 8px 25px rgba(34, 197, 94, 0.4)'
                  : '0 8px 25px rgba(239, 68, 68, 0.4)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              letterSpacing: '-0.01em'
            }}
            onMouseEnter={(e) => {
              if (!loading && amount && price && selectedStock && zamaInstance && signerPromise) {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = tradeType === 'buy'
                  ? '0 12px 35px rgba(34, 197, 94, 0.5)'
                  : '0 12px 35px rgba(239, 68, 68, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && amount && price && selectedStock && zamaInstance && signerPromise) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = tradeType === 'buy'
                  ? '0 8px 25px rgba(34, 197, 94, 0.4)'
                  : '0 8px 25px rgba(239, 68, 68, 0.4)';
              }
            }}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  animation: 'spin 1s linear infinite'
                }}>🔄</span>
                Processing Transaction...
              </>
            ) : (
              <>
                {tradeType === 'buy' ? '🚀 Execute Buy Order' : '📉 Execute Sell Order'}
              </>
            )}
          </button>

          {message && (
            <div style={{
              padding: '1rem',
              background: message.includes('❌') || message.includes('failed')
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)'
                : message.includes('✅') || message.includes('Successfully')
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
              border: `2px solid ${message.includes('❌') || message.includes('failed')
                ? 'rgba(239, 68, 68, 0.2)'
                : message.includes('✅') || message.includes('Successfully')
                  ? 'rgba(34, 197, 94, 0.2)'
                  : 'rgba(59, 130, 246, 0.2)'}`,
              borderRadius: '12px',
              color: message.includes('❌') || message.includes('failed')
                ? '#991b1b'
                : message.includes('✅') || message.includes('Successfully')
                  ? '#166534'
                  : '#1e40af',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '1rem',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: message.includes('❌') || message.includes('failed')
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : message.includes('✅') || message.includes('Successfully')
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                {message.includes('❌') || message.includes('failed')
                  ? '❌'
                  : message.includes('✅') || message.includes('Successfully')
                    ? '✅'
                    : 'ℹ️'}
              </div>
              <div style={{ flex: 1 }}>
                {message}
              </div>
            </div>
          )}

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>

          {/* Trading Info */}
          <div style={{
            padding: '1.25rem',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
            border: '2px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            fontSize: '0.875rem',
            color: '#1e40af',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}>
                📈
              </div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '800',
                color: '#1e40af',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Trading Information
              </h3>
            </div>
            <div style={{
              display: 'grid',
              gap: '0.75rem',
              fontSize: '0.8125rem',
              lineHeight: '1.6'
            }}>
              <div style={{
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>
                  🟢
                </div>
                <span><strong>Buy Orders:</strong> Mint new tokens (demo functionality)</span>
              </div>
              <div style={{
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>
                  🔴
                </div>
                <span><strong>Sell Orders:</strong> Use encrypted transfers for privacy</span>
              </div>
              <div style={{
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>
                  🔢
                </div>
                <span><strong>Precision:</strong> All amounts use 6-decimal precision</span>
              </div>
              <div style={{
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '8px',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>
                  🔐
                </div>
                <span><strong>Security:</strong> Protected by Zama's FHE technology</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}