import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '60px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <span style={{ fontSize: '18px' }}>🏛️</span>
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: 'white',
                margin: 0,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                letterSpacing: '-0.02em'
              }}>
                StockRWA
              </h1>
              <p style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: '400'
              }}>
                Confidential Trading Platform
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {/* Status Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              background: 'rgba(16, 185, 129, 0.15)',
              borderRadius: '16px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500'
              }}>
                Live
              </span>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '2px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
          }
          50% {
            box-shadow: 0 0 16px rgba(16, 185, 129, 0.8);
          }
          100% {
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
          }
        }
      `}</style>
    </header>
  );
}