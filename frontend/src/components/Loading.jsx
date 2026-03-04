export default function Loading({ message = 'Loading...' }) {
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