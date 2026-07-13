'use client';

// Color palette for product image placeholders
const PRODUCT_COLORS = {
  'Tops':        ['#8B0000', '#A93226'],
  'Leggings':    ['#1A237E', '#283593'],
  'Sports Bras': ['#880E4F', '#AD1457'],
  'Jackets':     ['#E91E63', '#C2185B'],
  'Sets':        ['#4A148C', '#6A1B9A'],
  'Accessories': ['#37474F', '#546E7A'],
  'default':     ['#8B0000', '#C0392B'],
};

function getProductColors(category) {
  return PRODUCT_COLORS[category] || PRODUCT_COLORS.default;
}

function getOriginalPrice(price, discount) {
  if (!discount) return null;
  return (price / (1 - discount / 100)).toFixed(2);
}

export default function ProductCard({ product, cartQty, onAdd, onIncrease, onDecrease }) {
  const [color1, color2] = getProductColors(product.category);
  const isOutOfStock = product.stockStatus === 'OUT_OF_STOCK' || product.stockQuantity === 0;
  const isLowStock  = product.stockStatus === 'LOW_STOCK'  || (product.stockQuantity > 0 && product.stockQuantity <= 5);
  const originalPrice = getOriginalPrice(product.price, product.discount);

  const stockLabel = isOutOfStock ? 'Out of Stock'
    : isLowStock ? `Low Stock (${product.stockQuantity})`
    : 'In Stock';
  const stockClass = isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock';

  return (
    <article
      className={`pos-product-card${isOutOfStock ? ' out-of-stock' : ''}`}
      id={`pos-product-${product.id}`}
      aria-label={`${product.name} — $${product.price}`}
    >
      {/* Image placeholder */}
      <div
        className="pos-product-img"
        style={{ background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)` }}
        aria-hidden="true"
      >
        {product.imageUrl && (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, zIndex: 0 }} 
          />
        )}
        {product.discount > 0 && (
          <span className="pos-discount-badge" aria-label={`${product.discount}% off`}>
            {product.discount}% OFF
          </span>
        )}
        <span className={`pos-stock-badge ${stockClass}`} aria-label={stockLabel}>
          {stockLabel}
        </span>
        {!product.imageUrl && <span className="pos-img-label">{product.name}</span>}
      </div>

      {/* Info */}
      <div className="pos-product-info">
        <div className="pos-product-name">{product.name}</div>
        <div className="pos-product-price-row">
          <span className="pos-product-price">${product.price.toFixed(2)}</span>
          {originalPrice && (
            <span className="pos-product-original-price">${originalPrice}</span>
          )}
        </div>

        {/* Add to cart / Qty selector */}
        {cartQty > 0 ? (
          <div className="pos-qty-selector" role="group" aria-label={`Quantity for ${product.name}`}>
            <button
              className="pos-qty-btn"
              onClick={() => onDecrease(product)}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="pos-qty-display" aria-live="polite">{cartQty}</span>
            <button
              className="pos-qty-btn"
              onClick={() => onIncrease(product)}
              disabled={isOutOfStock || cartQty >= product.stockQuantity}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : (
          <button
            className="pos-add-btn"
            id={`pos-add-${product.id}`}
            onClick={() => onAdd(product)}
            disabled={isOutOfStock}
            aria-label={isOutOfStock ? 'Out of stock' : `Add ${product.name} to cart`}
          >
            {isOutOfStock ? 'Out of Stock' : '+ Add to Cart'}
          </button>
        )}
      </div>
    </article>
  );
}
