/**
 * PageContainer
 * ─────────────────────────────────────────────────────
 * Shared layout wrapper that applies the site-wide
 * horizontal gutter (var(--gutter)) and 1920px ceiling.
 *
 * Usage:
 *   <PageContainer>...</PageContainer>
 *   <PageContainer tag="section" className={styles.foo}>...</PageContainer>
 *
 * All new page sections should use this component
 * instead of writing bespoke .container CSS rules.
 */

import styles from './PageContainer.module.css';

export default function PageContainer({
  children,
  /** HTML element to render as */
  tag: Tag = 'div',
  /** Extra class names to merge */
  className = '',
}) {
  return (
    <Tag className={`${styles.pageContainer} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
