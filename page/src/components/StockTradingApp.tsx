import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { Header } from './Header';
import { StockList } from './StockList';
import { TradingInterface } from './TradingInterface';
import { StockTradeInterface } from './StockTradeInterface';
import { BalanceDisplay } from './BalanceDisplay';
import { StockCreationForm } from './StockCreationForm';
import { StockFaucet } from './StockFaucet';
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
  const [activeTab, setActiveTab] = useState<'trade' | 'transfer' | 'create' | 'faucet'>('trade');

  const loadStocks = async () => {
    if (!isConnected) return;

    try {
      setLoading(true);

      // Create provider
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Debug: Log network and contract info
      const network = await provider.getNetwork();
      console.log('🌐 Current Network:', {
        chainId: network.chainId.toString(),
        name: network.name,
        ensAddress: network.ensAddress
      });

      console.log('📋 Contract Address:', STOCK_TRADING_FACTORY_ADDRESS);

      const factory = new ethers.Contract(
        STOCK_TRADING_FACTORY_ADDRESS,
        STOCK_TRADING_FACTORY_ABI,
        provider
      );

      // Debug: Check if contract exists
      const code = await provider.getCode(STOCK_TRADING_FACTORY_ADDRESS);
      console.log('📦 Contract Code Length:', code.length);
      console.log('📦 Contract Code:', code.slice(0, 100) + '...');

      // Get all stock names
      console.log('🔍 Calling getAllStockNames...');
      const stockNames = await factory.getAllStockNames();
      console.log('📊 Stock Names:', stockNames);

      // Get details for each stock
      const stockDetails = await Promise.all(
        stockNames.map(async (name: string) => {
          const [stockName, price, tokenAddress] = await factory.getStockInfo(name);
          // Convert price from wei (with 6 decimal precision) back to USD format
          const priceInUSD = Number(price) / 1000000;
          return {
            name: stockName,
            symbol: stockName, // Using name as symbol for now
            price: priceInUSD.toFixed(2), // Display as USD with 2 decimal places
            tokenAddress
          };
        })
      );

      setStocks(stockDetails);
    } catch (error) {
      console.error('❌ Failed to load stocks:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error?.code,
        data: error?.data,
        reason: error?.reason
      });
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '-10%',
        width: '600px',
        height: '600px',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '-10%',
        width: '800px',
        height: '800px',
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        zIndex: 0
      }} />

      <Header />

      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '1.5rem 1rem',
        position: 'relative',
        zIndex: 1
      }}>
        {!isConnected ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 3rem',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 20px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background decoration for welcome card */}
            <div style={{
              position: 'absolute',
              top: '-80px',
              right: '-80px',
              width: '200px',
              height: '200px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              borderRadius: '50%',
              filter: 'blur(60px)'
            }} />

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: '0 12px 30px rgba(102, 126, 234, 0.3)'
              }}>
                🏛️
              </div>
            </div>

            <h1 style={{
              fontSize: '2.25rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
              position: 'relative',
              zIndex: 1
            }}>
              StockRWA Trading Platform
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              marginBottom: '1.5rem',
              fontWeight: '500',
              position: 'relative',
              zIndex: 1
            }}>
              Trade confidential stock tokens with Zama's FHE technology
            </p>
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              border: '2px solid rgba(102, 126, 234, 0.2)',
              borderRadius: '12px',
              display: 'inline-block',
              position: 'relative',
              zIndex: 1
            }}>
              <p style={{
                color: '#667eea',
                fontSize: '0.875rem',
                fontWeight: '600',
                margin: 0
              }}>
                🔗 Please connect your wallet to start trading
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Balance Display */}
            <BalanceDisplay
              address={address!}
              stocks={stocks}
              onRefresh={handleRefresh}
            />

            {/* Tab Navigation */}
            <div style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Background decoration for tab container */}
              <div style={{
                position: 'absolute',
                top: '-40px',
                left: '-40px',
                width: '150px',
                height: '150px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                borderRadius: '50%',
                filter: 'blur(40px)'
              }} />

              <div style={{
                display: 'flex',
                borderBottom: '2px solid rgba(229, 231, 235, 0.8)',
                position: 'relative',
                zIndex: 1
              }}>
                <button
                  onClick={() => setActiveTab('trade')}
                  style={{
                    flex: 1,
                    padding: '1rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    border: 'none',
                    background: activeTab === 'trade'
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                      : 'transparent',
                    color: activeTab === 'trade' ? 'white' : '#6b7280',
                    borderBottom: activeTab === 'trade' ? 'none' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: activeTab === 'trade' ? '12px 12px 0 0' : '0',
                    boxShadow: activeTab === 'trade' ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    textShadow: activeTab === 'trade' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'trade') {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                      e.currentTarget.style.color = '#3b82f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'trade') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6b7280';
                    }
                  }}
                >
                  📊 Trade
                </button>
                <button
                  onClick={() => setActiveTab('transfer')}
                  style={{
                    flex: 1,
                    padding: '1rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    border: 'none',
                    background: activeTab === 'transfer'
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                      : 'transparent',
                    color: activeTab === 'transfer' ? 'white' : '#6b7280',
                    borderBottom: activeTab === 'transfer' ? 'none' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: activeTab === 'transfer' ? '12px 12px 0 0' : '0',
                    boxShadow: activeTab === 'transfer' ? '0 4px 15px rgba(34, 197, 94, 0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    textShadow: activeTab === 'transfer' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'transfer') {
                      e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                      e.currentTarget.style.color = '#22c55e';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'transfer') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6b7280';
                    }
                  }}
                >
                  💱 Transfer
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  style={{
                    flex: 1,
                    padding: '1rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    border: 'none',
                    background: activeTab === 'create'
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'transparent',
                    color: activeTab === 'create' ? 'white' : '#6b7280',
                    borderBottom: activeTab === 'create' ? 'none' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: activeTab === 'create' ? '12px 12px 0 0' : '0',
                    boxShadow: activeTab === 'create' ? '0 4px 15px rgba(245, 158, 11, 0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    textShadow: activeTab === 'create' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'create') {
                      e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
                      e.currentTarget.style.color = '#f59e0b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'create') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6b7280';
                    }
                  }}
                >
                  🏭 Create Stock
                </button>
                <button
                  onClick={() => setActiveTab('faucet')}
                  style={{
                    flex: 1,
                    padding: '1rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    border: 'none',
                    background: activeTab === 'faucet'
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                      : 'transparent',
                    color: activeTab === 'faucet' ? 'white' : '#6b7280',
                    borderBottom: activeTab === 'faucet' ? 'none' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: activeTab === 'faucet' ? '12px 12px 0 0' : '0',
                    boxShadow: activeTab === 'faucet' ? '0 4px 15px rgba(139, 92, 246, 0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    textShadow: activeTab === 'faucet' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'faucet') {
                      e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                      e.currentTarget.style.color = '#8b5cf6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'faucet') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6b7280';
                    }
                  }}
                >
                  🚰 Faucet
                </button>
              </div>

              {/* Tab Content */}
              <div style={{
                padding: '1.5rem',
                position: 'relative',
                zIndex: 1,
                minHeight: '500px'
              }}>
                {activeTab === 'trade' ? (
                  <div style={{
                    maxWidth: '900px',
                    margin: '0 auto'
                  }}>
                    <StockTradeInterface
                      stocks={stocks}
                      userAddress={address!}
                      onTradeComplete={handleRefresh}
                    />
                  </div>
                ) : activeTab === 'transfer' ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(350px, 1fr) minmax(350px, 1fr)',
                    gap: '1.5rem',
                    alignItems: 'start'
                  }}>
                    {/* Stock List */}
                    <div>
                      <StockList
                        stocks={stocks}
                        loading={loading}
                        onStockSelect={handleStockSelect}
                        selectedStock={selectedStock}
                        onRefresh={handleRefresh}
                      />
                    </div>

                    {/* Transfer Interface */}
                    <div>
                      <TradingInterface
                        selectedStock={selectedStock}
                        userAddress={address!}
                        onTradeComplete={handleRefresh}
                      />
                    </div>
                  </div>
                ) : activeTab === 'create' ? (
                  <div style={{
                    maxWidth: '600px',
                    margin: '0 auto'
                  }}>
                    <StockCreationForm onStockCreated={handleRefresh} />
                  </div>
                ) : (
                  <div style={{
                    maxWidth: '600px',
                    margin: '0 auto'
                  }}>
                    <StockFaucet stocks={stocks} onMintComplete={handleRefresh} />
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