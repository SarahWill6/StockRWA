import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import type { Stock, TokenBalance } from '../type';
import { STOCK_TOKEN_ABI } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';

interface BalanceDisplayProps {
  address: string;
  stocks: Stock[];
  onRefresh: () => void;
}

export function BalanceDisplay({ address, stocks, onRefresh }: BalanceDisplayProps) {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const { instance: zamaInstance } = useZamaInstance();
  const signer = useEthersSigner();

  const loadBalances = async () => {
    if (!address || stocks.length === 0) return;

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);

      const balancePromises = stocks.map(async (stock) => {
        try {
          const stockToken = new ethers.Contract(
            stock.tokenAddress,
            STOCK_TOKEN_ABI,
            provider
          );

          // Get encrypted balance handle
          const encryptedBalance = await stockToken.confidentialBalanceOf(address);

          return {
            symbol: stock.symbol,
            balance: '***', // Hidden for privacy
            encryptedBalance: encryptedBalance,
            tokenAddress: stock.tokenAddress
          };
        } catch (error) {
          console.error(`Failed to load balance for ${stock.symbol}:`, error);
          return {
            symbol: stock.symbol,
            balance: 'Error',
            encryptedBalance: '0x0'
          };
        }
      });

      const results = await Promise.all(balancePromises);
      setBalances(results);
    } catch (error) {
      console.error('Failed to load balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, [address, stocks]);

  const handleRefreshBalances = () => {
    loadBalances();
    onRefresh();
  };

  const decryptBalance = async (balance: TokenBalance) => {
    if (!zamaInstance || !signer || !balance.tokenAddress) {
      console.error('Missing dependencies for decryption');
      return;
    }

    try {
      // Set decrypting state
      setBalances(prev =>
        prev.map(b =>
          b.symbol === balance.symbol
            ? { ...b, isDecrypting: true }
            : b
        )
      );

      // Generate keypair for user decryption
      const keypair = zamaInstance.generateKeypair();

      const handleContractPairs = [
        {
          handle: balance.encryptedBalance,
          contractAddress: balance.tokenAddress,
        },
      ];

      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "1"; // 1 day validity
      const contractAddresses = [balance.tokenAddress];

      // Create EIP712 signature for user decryption
      const eip712 = zamaInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );

      const signature = await signer.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message,
      );

      // Perform user decryption
      const result = await zamaInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays,
      );

      const decryptedValue = result[balance.encryptedBalance];
      console.log('Decrypted balance:', decryptedValue);

      // Update balance with decrypted value
      setBalances(prev =>
        prev.map(b =>
          b.symbol === balance.symbol
            ? {
                ...b,
                decryptedBalance: decryptedValue.toString(),
                isDecrypting: false
              }
            : b
        )
      );

    } catch (error: any) {
      console.error('Decryption failed:', error);

      // Reset decrypting state and show error
      setBalances(prev =>
        prev.map(b =>
          b.symbol === balance.symbol
            ? {
                ...b,
                decryptedBalance: 'Error',
                isDecrypting: false
              }
            : b
        )
      );
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#111827',
          margin: 0
        }}>
          💰 Your Portfolio
        </h2>
        <button
          onClick={handleRefreshBalances}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }
          }}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      <div style={{
        padding: '1rem',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        marginBottom: '1.5rem'
      }}>
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          margin: 0,
          marginBottom: '0.5rem'
        }}>
          <strong>Connected Address:</strong>
        </p>
        <p style={{
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          color: '#111827',
          margin: 0,
          wordBreak: 'break-all'
        }}>
          {address}
        </p>
      </div>

      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6b7280'
        }}>
          Loading balances...
        </div>
      ) : balances.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6b7280'
        }}>
          No token balances to display
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1rem'
        }}>
          {balances.map((balance, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}
            >
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>
                  {balance.symbol}
                </h3>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: 0,
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}>
                  Handle: {balance.encryptedBalance}
                </p>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '0.25rem'
                }}>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#111827'
                  }}>
                    {balance.decryptedBalance !== undefined
                      ? (balance.decryptedBalance === 'Error'
                          ? '❌ Error'
                          : `${balance.decryptedBalance} ${balance.symbol}`)
                      : balance.balance
                    }
                  </span>
                  {balance.decryptedBalance === undefined && (
                    <div style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      color: '#92400e'
                    }}>
                      🔒 Encrypted
                    </div>
                  )}
                  {balance.decryptedBalance !== undefined && balance.decryptedBalance !== 'Error' && (
                    <div style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#dcfce7',
                      border: '1px solid #bbf7d0',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      color: '#166534'
                    }}>
                      🔓 Decrypted
                    </div>
                  )}
                </div>

                {balance.decryptedBalance === undefined && (
                  <button
                    onClick={() => decryptBalance(balance)}
                    disabled={balance.isDecrypting || !zamaInstance || !signer}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: balance.isDecrypting ? '#d1d5db' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: balance.isDecrypting || !zamaInstance || !signer ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      if (!balance.isDecrypting && zamaInstance && signer) {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!balance.isDecrypting && zamaInstance && signer) {
                        e.currentTarget.style.backgroundColor = '#3b82f6';
                      }
                    }}
                  >
                    {balance.isDecrypting ? '🔄 Decrypting...' : '🔓 Decrypt'}
                  </button>
                )}

                {balance.decryptedBalance !== undefined && (
                  <button
                    onClick={() => {
                      setBalances(prev =>
                        prev.map(b =>
                          b.symbol === balance.symbol
                            ? { ...b, decryptedBalance: undefined }
                            : b
                        )
                      );
                    }}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#4b5563';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#6b7280';
                    }}
                  >
                    🔒 Hide
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#ecfdf5',
        border: '1px solid #bbf7d0',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#166534'
      }}>
        <strong>🔐 Privacy & Decryption:</strong>
        <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '1rem' }}>
          <li>Your balances are encrypted using Zama's FHE technology</li>
          <li>Click "🔓 Decrypt" to view actual amounts (requires wallet signature)</li>
          <li>Only you can decrypt your balances using your private key</li>
          <li>Use "🔒 Hide" to re-encrypt the displayed amounts</li>
        </ul>
      </div>
    </div>
  );
}