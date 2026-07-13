'use client';

const ACTIVE_ORDERS = [
  { id: '001', customer: 'Tanya M.', items: 3, status: 'Processing' },
  { id: '002', customer: 'Rudo C.',  items: 1, status: 'Ready' },
  { id: '003', customer: 'Natasha D.', items: 2, status: 'Processing' },
];

export default function ActiveOrdersBar() {
  return (
    <div className="pos-active-bar" role="complementary" aria-label="Active orders">
      <div className="pos-active-bar-label">Active</div>
      <div className="pos-active-orders">
        {ACTIVE_ORDERS.map((order) => (
          <div
            key={order.id}
            className="pos-order-tile"
            id={`pos-active-order-${order.id}`}
            role="button"
            tabIndex={0}
            aria-label={`Order ${order.id} for ${order.customer} — ${order.status}`}
          >
            <div className="pos-order-num-badge" aria-hidden="true">#{order.id}</div>
            <div className="pos-order-tile-info">
              <div className="pos-order-tile-name">{order.customer}</div>
              <div className="pos-order-tile-meta">
                {order.items} item{order.items !== 1 ? 's' : ''}
                <span
                  className={`pos-order-status-badge ${order.status.toLowerCase()}`}
                  aria-label={`Status: ${order.status}`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
