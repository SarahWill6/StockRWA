import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { Header } from './Header';
import { StockList } from './StockList';
import { TradingInterface } from './TradingInterface';
import { BalanceDisplay } from './BalanceDisplay';
import { StockCreationForm } from './StockCreationForm';
import type{ Stock } from '../type';
import {
  STOCK_TRADING_FACTORY_ADDRESS,
  STOCK_TRADING_FACTORY_ABI
} from '../config/contracts';

export function StockTradingApp() {
  const { address, isConnected } = useAccount();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'trading' | 'create'>('trading');

  const loadStocks = async () => {
    if (!isConnected) return;

    try {
      setLoading(true);

      // Create provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const factory = new ethers.Contract(
        STOCK_TRADING_FACTORY_ADDRESS,
        STOCK_TRADING_FACTORY_ABI,
        provider
      );

      // Get all stock names
      const stockNames = await factory.getAllStockNames();

      // Get details for each stock
      const stockDetails = await Promise.all(
        stockNames.map(async (name: string) => {
          const [stockName, price, tokenAddress] = await factory.getStockInfo(name);
          return {
            name: stockName,
            symbol: stockName, // Using name as symbol for now
            price: ethers.formatEther(price),
            tokenAddress
          };
        })
      );

      setStocks(stockDetails);
    } catch (error) {
      console.error('Failed to load stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadStocks();
    }
  }, [isConnected]);

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
  };

  const handleRefresh = () => {
    loadStocks();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header />

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {!isConnected ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              🏛️ StockRWA Trading Platform
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: '#6b7280',
              marginBottom: '2rem'
            }}>
              Trade confidential stock tokens with Zama's FHE technology
            </p>
            <p style={{ color: '#9ca3af' }}>
              Please connect your wallet to start trading
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '2rem' }}>
            {/* Balance Display */}
            <BalanceDisplay
              address={address!}
              stocks={stocks}
              onRefresh={handleRefresh}
            />

            {/* Tab Navigation */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px 12px 0 0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setActiveTab('trading')}
                  style={{
                    flex: 1,
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    border: 'none',
                    backgroundColor: activeTab === 'trading' ? '#f8fafc' : 'white',
                    color: activeTab === 'trading' ? '#1f2937' : '#6b7280',
                    borderBottom: activeTab === 'trading' ? '2px solid #3b82f6' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  📈 Trading
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  style={{
                    flex: 1,
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    border: 'none',
                    backgroundColor: activeTab === 'create' ? '#f8fafc' : 'white',
                    color: activeTab === 'create' ? '#1f2937' : '#6b7280',
                    borderBottom: activeTab === 'create' ? '2px solid #3b82f6' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🏭 Create Stock
                </button>
              </div>

              {/* Tab Content */}
              <div style={{ padding: '1.5rem' }}>
                {activeTab === 'trading' ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(400px, 1fr) minmax(400px, 1fr)',
                    gap: '2rem'
                  }}>
                    {/* Stock List */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <StockList
                        stocks={stocks}
                        loading={loading}
                        onStockSelect={handleStockSelect}
                        selectedStock={selectedStock}
                        onRefresh={handleRefresh}
                      />
                    </div>

                    {/* Trading Interface */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <TradingInterface
                        selectedStock={selectedStock}
                        userAddress={address!}
                        onTradeComplete={handleRefresh}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    maxWidth: '600px',
                    margin: '0 auto'
                  }}>
                    <StockCreationForm onStockCreated={handleRefresh} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}