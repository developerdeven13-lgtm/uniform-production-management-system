export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#EDEBE4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#0f2416', letterSpacing: '-1.5px', lineHeight: 1 }}>
            Midas
          </p>
          <p style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888780', marginTop: 4 }}>
            Uniform Production Management
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#fff',
            border: '0.5px solid #D3D1C7',
            borderRadius: 16,
            padding: '28px 28px',
          }}
        >
          {children}
        </div>

        <p style={{ textAlign: 'center', fontSize: 10, color: '#888780', marginTop: 16 }}>
          Midas Health Services · Uniform Production
        </p>
      </div>
    </div>
  )
}
