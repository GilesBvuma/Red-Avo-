'use client';

const CATEGORIES = [
  'All',
  'Tops',
  'Leggings',
  'Sports Bras',
  'Jackets',
  'Sets',
  'Accessories',
];

export default function CategoryTabs({ activeCategory, onCategoryChange }) {
  return (
    <div className="pos-categories" role="tablist" aria-label="Product categories">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          id={`pos-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
          role="tab"
          aria-selected={activeCategory === cat}
          className={`pos-cat-tab${activeCategory === cat ? ' active' : ''}`}
          onClick={() => onCategoryChange(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
