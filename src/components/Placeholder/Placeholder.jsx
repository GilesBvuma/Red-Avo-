import styles from './Placeholder.module.css';

/**
 * Reusable asset placeholder component.
 * Displays a dashed bordered box with a bold centred label.
 * Replace this component with <Image /> or <video> when real assets are available.
 *
 * @param {string} label     – e.g. "[IMAGE_1]"
 * @param {string} subtitle  – optional description e.g. "Hero outfit flat-lay"
 * @param {string} className – optional extra class for sizing overrides
 */
export default function Placeholder({ label, subtitle, className = '' }) {
  const isImagePath = typeof label === 'string' && (label.startsWith('/') || label.startsWith('http'));

  if (isImagePath) {
    return (
      <img
        src={label}
        alt={subtitle || 'Red Avo activewear asset'}
        className={`${styles.image} ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`${styles.placeholder} ${className}`} aria-label={`Placeholder: ${label}`}>
      <div className={styles.inner}>
        <span className={styles.label}>{label}</span>
        {subtitle && <small className={styles.subtitle}>{subtitle}</small>}
      </div>
    </div>
  );
}
