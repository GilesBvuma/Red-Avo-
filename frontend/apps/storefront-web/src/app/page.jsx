/**
 * Storefront home page — placeholder for Phase 4.
 *
 * In Phase 4 this becomes the public product catalogue, reading from
 * /api/products and /api/promotions via @red-avo/api-client.
 */
export default function StorefrontHome() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        background: '#0c0c0c',
        color: '#f0f0f0',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#c0392b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
        }}
      >
        🥑
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Red Avo</h1>
      <p style={{ color: '#9ca3af', textAlign: 'center', maxWidth: 400 }}>
        The public storefront is coming in Phase 4. The backend API and POS are
        already running — this page will be replaced with the full product
        catalogue, cart, and Paynow checkout.
      </p>
      <a
        href="http://localhost:3000/pos"
        style={{
          marginTop: '1rem',
          padding: '0.75rem 2rem',
          background: '#c0392b',
          color: '#fff',
          borderRadius: 8,
          fontWeight: 600,
          display: 'inline-block',
        }}
      >
        Open POS →
      </a>
    </main>
  );
}
