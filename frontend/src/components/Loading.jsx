import { useState, useEffect } from 'react'

export default function Loading({ message = 'Loading...', onRetry }) {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 8000)
    return () => clearTimeout(timer)
  }, [])

  if (timedOut) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', 
        justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ color: '#ef233c', fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>
            Something went wrong
          </div>
          <div style={{ color: '#888', marginBottom: '24px' }}>
            The server is taking too long to respond. Make sure the backend is running.
          </div>
          {onRetry && (
            <button onClick={onRetry}
              style={{ padding: '10px 24px', background: '#4361ee', color: 'white', 
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', 
      justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #f0f2f5',
          borderTop: '4px solid #4361ee', borderRadius: '50%', 
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ color: '#4361ee', fontWeight: 'bold' }}>{message}</div>
      </div>
    </div>
  )
}