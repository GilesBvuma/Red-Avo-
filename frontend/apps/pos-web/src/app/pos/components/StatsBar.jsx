'use client';

export default function StatsBar({ stats, loading }) {
  const items = [
    {
      id: 'sales',
      label: "Today's Sales",
      value: loading ? '—' : `$${(stats?.salesToday || 0).toFixed(2)}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      colorClass: 'red',
    },
    {
      id: 'orders',
      label: 'Orders Today',
      value: loading ? '—' : (stats?.ordersToday ?? 0),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
      colorClass: 'dark',
    },
    {
      id: 'lowstock',
      label: 'Low Stock Items',
      value: loading ? '—' : (stats?.lowStockCount ?? 0),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      colorClass: 'warn',
      badge: !loading && stats?.lowStockCount > 0 ? '!' : null,
    },
    {
      id: 'messages',
      label: 'Messages Sent',
      value: loading ? '—' : (stats?.messagesToday ?? 0),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      colorClass: 'green',
    },
  ];

  return (
    <div className="pos-stats-bar" role="region" aria-label="Dashboard statistics">
      {items.map((item) => (
        <div key={item.id} className="pos-stat-item" id={`pos-stat-${item.id}`}>
          <div className={`pos-stat-icon ${item.colorClass}`} aria-hidden="true">
            {item.icon}
          </div>
          <div className="pos-stat-data">
            <div className="pos-stat-value">
              {item.value}
              {item.badge && (
                <span className="pos-stat-badge" aria-label="Alert">{item.badge}</span>
              )}
            </div>
            <div className="pos-stat-label">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
