import React from 'react';
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
      <div>
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
            📈 Stock Market
          </h2>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '3rem',
          color: '#6b7280'
        }}>
          Loading stocks...
        </div>
      </div>
    );
  }

  return (
    <div>
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
          📈 Stock Market
        </h2>
        <button
          onClick={onRefresh}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            color: '#374151',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {stocks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280'
        }}>
          <p>No stocks available</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Create some stocks using the factory contract
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {stocks.map((stock, index) => (
            <div
              key={index}
              onClick={() => onStockSelect(stock)}
              style={{
                padding: '1rem',
                border: selectedStock?.name === stock.name
                  ? '2px solid #3b82f6'
                  : '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: selectedStock?.name === stock.name
                  ? '#eff6ff'
                  : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                ':hover': {
                  borderColor: '#3b82f6',
                  backgroundColor: '#f8fafc'
                }
              }}
              onMouseEnter={(e) => {
                if (selectedStock?.name !== stock.name) {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStock?.name !== stock.name) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    {stock.symbol}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {stock.name}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#111827'
                  }}>
                    ${parseFloat(stock.price).toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    per token
                  </div>
                </div>
              </div>

              {selectedStock?.name === stock.name && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: '#dbeafe',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#1e40af'
                }}>
                  Selected for trading
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}