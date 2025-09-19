import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
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
  const signerPromise = useEthersSigner();

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
    if (!zamaInstance || !signerPromise || !balance.tokenAddress) {
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

      // Get the actual signer from the promise
      const signer = await signerPromise;
      if (!signer) {
        throw new Error('Failed to get signer');
      }

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

      // Format balance with 6 decimals (divide by 1,000,000)
      const formattedBalance = (Number(decryptedValue) / 1000000).toFixed(6);

      // Update balance with decrypted value
      setBalances(prev =>
        prev.map(b =>
          b.symbol === balance.symbol
            ? {
                ...b,
                decryptedBalance: formattedBalance,
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
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08), 0 3px 8px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-30px',
        right: '-30px',
        width: '120px',
        height: '120px',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        borderRadius: '50%',
        filter: 'blur(30px)'
      }} />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            boxShadow: '0 3px 10px rgba(245, 158, 11, 0.3)'
          }}>
            💰
          </div>
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              Your Portfolio
            </h2>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: 0,
              fontWeight: '500'
            }}>
              Encrypted Token Holdings
            </p>
          </div>
        </div>
        <button
          onClick={handleRefreshBalances}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: loading ? 'none' : '0 3px 10px rgba(245, 158, 11, 0.3)',
            transform: loading ? 'none' : 'translateY(0)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 3px 10px rgba(245, 158, 11, 0.3)';
            }
          }}
        >
          <span style={{
            display: 'inline-block',
            animation: loading ? 'spin 1s linear infinite' : 'none',
            fontSize: '12px'
          }}>🔄</span>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div style={{
        padding: '1rem',
        background: 'rgba(102, 126, 234, 0.05)',
        border: '1px solid rgba(102, 126, 234, 0.1)',
        borderRadius: '8px',
        marginBottom: '1.25rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px'
          }}>
            🔗
          </div>
          <p style={{
            fontSize: '0.75rem',
            color: '#667eea',
            fontWeight: '600',
            margin: 0
          }}>
            Connected Wallet
          </p>
        </div>
        <p style={{
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          color: '#374151',
          margin: 0,
          wordBreak: 'break-all',
          background: 'rgba(255, 255, 255, 0.7)',
          padding: '0.5rem',
          borderRadius: '6px',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          {address}
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

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
          gap: '1rem',
          position: 'relative',
          zIndex: 1
        }}>
          {balances.map((balance, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                borderRadius: '12px',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06), 0 3px 8px rgba(0, 0, 0, 0.02)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.06), 0 3px 8px rgba(0, 0, 0, 0.02)';
              }}
            >
              {/* Background decoration */}
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                width: '60px',
                height: '60px',
                background: `linear-gradient(135deg, ${
                  ['rgba(102, 126, 234, 0.1)', 'rgba(6, 214, 160, 0.1)', 'rgba(247, 37, 133, 0.1)', 'rgba(67, 97, 238, 0.1)', 'rgba(247, 127, 0, 0.1)'][index % 5]
                } 0%, ${
                  ['rgba(118, 75, 162, 0.1)', 'rgba(17, 138, 178, 0.1)', 'rgba(181, 23, 158, 0.1)', 'rgba(114, 9, 183, 0.1)', 'rgba(252, 191, 73, 0.1)'][index % 5]
                } 100%)`,
                borderRadius: '50%',
                filter: 'blur(15px)'
              }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${
                    ['#667eea', '#06d6a0', '#f72585', '#4361ee', '#f77f00'][index % 5]
                  } 0%, ${
                    ['#764ba2', '#118ab2', '#b5179e', '#7209b7', '#fcbf49'][index % 5]
                  } 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)'
                }}>
                  {balance.symbol.substring(0, 2).toUpperCase()}
                </div>

                <div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem',
                    letterSpacing: '-0.01em'
                  }}>
                    {balance.symbol}
                  </h3>
                  <div style={{
                    fontSize: '0.625rem',
                    color: '#6b7280',
                    fontFamily: 'monospace',
                    background: 'rgba(107, 114, 128, 0.1)',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    {balance.encryptedBalance.substring(0, 10)}...
                  </div>
                </div>
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
                  gap: '0.75rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    textAlign: 'right'
                  }}>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: '800',
                      color: balance.decryptedBalance !== undefined && balance.decryptedBalance !== 'Error'
                        ? '#059669'
                        : '#6b7280',
                      marginBottom: '0.125rem',
                      letterSpacing: '-0.02em'
                    }}>
                      {balance.decryptedBalance !== undefined
                        ? (balance.decryptedBalance === 'Error'
                            ? '❌ Error'
                            : `${balance.decryptedBalance} ${balance.symbol}`)
                        : '***'
                      }
                    </div>

                    {balance.decryptedBalance === undefined ? (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        borderRadius: '8px',
                        fontSize: '0.625rem',
                        fontWeight: '600',
                        color: '#d97706'
                      }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#f59e0b',
                          boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)'
                        }} />
                        ENCRYPTED
                      </div>
                    ) : balance.decryptedBalance !== 'Error' ? (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(4, 120, 87, 0.1) 100%)',
                        border: '1px solid rgba(5, 150, 105, 0.2)',
                        borderRadius: '8px',
                        fontSize: '0.625rem',
                        fontWeight: '600',
                        color: '#059669'
                      }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)'
                        }} />
                        DECRYPTED
                      </div>
                    ) : (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        fontSize: '0.625rem',
                        fontWeight: '600',
                        color: '#dc2626'
                      }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)'
                        }} />
                        ERROR
                      </div>
                    )}
                  </div>
                </div>

                {balance.decryptedBalance === undefined && (
                  <button
                    onClick={() => decryptBalance(balance)}
                    disabled={balance.isDecrypting || !zamaInstance || !signerPromise}
                    style={{
                      padding: '0.5rem 1rem',
                      background: balance.isDecrypting || !zamaInstance || !signerPromise
                        ? '#e5e7eb'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: balance.isDecrypting || !zamaInstance || !signerPromise ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      whiteSpace: 'nowrap',
                      boxShadow: balance.isDecrypting || !zamaInstance || !signerPromise
                        ? 'none'
                        : '0 3px 10px rgba(102, 126, 234, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      position: 'relative',
                      zIndex: 1
                    }}
                    onMouseEnter={(e) => {
                      if (!balance.isDecrypting && zamaInstance && signerPromise) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!balance.isDecrypting && zamaInstance && signerPromise) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 3px 10px rgba(102, 126, 234, 0.3)';
                      }
                    }}
                  >
                    <span style={{
                      display: 'inline-block',
                      animation: balance.isDecrypting ? 'spin 1s linear infinite' : 'none'
                    }}>
                      {balance.isDecrypting ? '🔄' : '🔓'}
                    </span>
                    {balance.isDecrypting ? 'Decrypting...' : 'Decrypt'}
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
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 3px 10px rgba(107, 114, 128, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      position: 'relative',
                      zIndex: 1
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 3px 10px rgba(107, 114, 128, 0.3)';
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
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: '#ecfdf5',
        border: '1px solid #bbf7d0',
        borderRadius: '6px',
        fontSize: '0.75rem',
        color: '#166534'
      }}>
        <strong>🔐 Privacy & Decryption:</strong>
        <ul style={{ margin: '0.375rem 0 0 0.75rem', paddingLeft: '0.75rem' }}>
          <li>Your balances are encrypted using Zama's FHE technology</li>
          <li>Click "🔓 Decrypt" to view actual amounts (requires wallet signature)</li>
          <li>Only you can decrypt your balances using your private key</li>
          <li>Use "🔒 Hide" to re-encrypt the displayed amounts</li>
        </ul>
      </div>
    </div>
  );
}