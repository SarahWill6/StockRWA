import type { Stock } from '../type';

interface StockListProps {
  stocks: Stock[];
  loading: boolean;
  onStockSelect: (stock: Stock) => void;
  selectedStock: Stock | null;
  onRefresh: () => void;
}

export function StockList({
  stocks,
  loading,
  onStockSelect,
  selectedStock,
  onRefresh
}: StockListProps) {
  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08), 0 3px 8px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            📈
          </div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Stock Market
          </h2>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '120px',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            color: '#6b7280',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            Loading stocks...
          </p>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08), 0 3px 8px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            📈
          </div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Stock Market
          </h2>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6b7280'
        }}>
          <div style={{
            fontSize: '2.5rem',
            marginBottom: '0.75rem',
            opacity: 0.3
          }}>
            📊
          </div>
          <p style={{
            fontSize: '0.95rem',
            fontWeight: '500'
          }}>
            No stocks available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08), 0 3px 8px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            📈
          </div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Stock Market
          </h2>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: loading ? 'none' : '0 3px 10px rgba(102, 126, 234, 0.3)',
            transform: loading ? 'none' : 'translateY(0)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 3px 10px rgba(102, 126, 234, 0.3)';
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
        display: 'grid',
        gap: '0.75rem'
      }}>
        {stocks.map((stock, index) => (
          <div
            key={stock.tokenAddress}
            onClick={() => onStockSelect(stock)}
            style={{
              padding: '1rem',
              border: selectedStock?.name === stock.name
                ? '2px solid transparent'
                : '1px solid rgba(229, 231, 235, 0.8)',
              borderRadius: '10px',
              background: selectedStock?.name === stock.name
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: selectedStock?.name === stock.name
                ? '0 6px 20px rgba(102, 126, 234, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                : '0 2px 6px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              if (selectedStock?.name !== stock.name) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.15)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedStock?.name !== stock.name) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          >
            {/* Selected indicator */}
            {selectedStock?.name === stock.name && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '10px 10px 0 0'
              }} />
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
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
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}>
                  {stock.symbol.substring(0, 2).toUpperCase()}
                </div>

                <div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.125rem',
                    letterSpacing: '-0.01em'
                  }}>
                    {stock.name}
                  </h3>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    {stock.symbol}
                  </p>
                </div>
              </div>

              <div style={{
                textAlign: 'right'
              }}>
                <div style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#059669',
                  marginBottom: '0.125rem'
                }}>
                  ${parseFloat(stock.price).toFixed(2)}
                </div>
                <div style={{
                  fontSize: '0.625rem',
                  color: '#6b7280',
                  padding: '0.125rem 0.375rem',
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>
                  Per Token
                </div>
              </div>
            </div>

            {selectedStock?.name === stock.name && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.5rem',
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '6px',
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}>
                <div style={{
                  fontSize: '0.625rem',
                  color: '#667eea',
                  fontWeight: '600',
                  marginBottom: '0.125rem'
                }}>
                  ✓ SELECTED FOR TRADING
                </div>
                <div style={{
                  fontSize: '0.625rem',
                  color: '#6b7280',
                  fontFamily: 'monospace'
                }}>
                  {stock.tokenAddress.substring(0, 16)}...
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}