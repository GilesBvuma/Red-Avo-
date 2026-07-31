'use client';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '12px',
      padding: '16px 28px',
      borderTop: '1px solid #E8E8E8',
      background: '#fff'
    }}>
      <span style={{ fontSize: '13px', color: '#6B7280' }}>
        Page {currentPage} of {totalPages}
      </span>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          style={{
            padding: '6px 12px',
            background: currentPage === 1 ? '#F3F4F6' : '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            color: currentPage === 1 ? '#9CA3AF' : '#374151',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          style={{
            padding: '6px 12px',
            background: currentPage === totalPages ? '#F3F4F6' : '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            color: currentPage === totalPages ? '#9CA3AF' : '#374151',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
