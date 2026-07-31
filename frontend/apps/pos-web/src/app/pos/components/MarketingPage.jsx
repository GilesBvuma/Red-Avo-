'use client';

import { useState, useEffect } from 'react';
import BulkNotifyPanel from './BulkNotifyPanel'; // Re-use the existing component for now
import CommunityTab from './CommunityTab';
import { fetchPendingReviews, approveReview, deleteReview, fetchContactMessages, markContactMessageRead } from '../lib/api';

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState('campaigns');

  const tabs = [
    { id: 'campaigns', label: 'Campaigns & Bulk Notify' },
    { id: 'segments', label: 'Customer Segments' },
    { id: 'automations', label: 'Automations' },
    { id: 'reviews', label: 'Product Reviews' },
    { id: 'inquiries', label: 'Customer Inquiries' },
    { id: 'community', label: '📸 Community' },
  ];

  const [pendingReviews, setPendingReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [inquiries, setInquiries] = useState([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const data = await fetchPendingReviews();
      setPendingReviews(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const data = await fetchContactMessages();
      setInquiries(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInquiries(false);
    }
  };

  const fetchPendingReviewsWrapper = () => loadReviews();

  useEffect(() => {
    if (activeTab === 'reviews') {
      loadReviews();
    } else if (activeTab === 'inquiries') {
      loadInquiries();
    }
  }, [activeTab]);

  const handleMarkInquiryRead = async (id) => {
    try {
      await markContactMessageRead(id);
      setInquiries(prev => prev.map(msg => msg.id === id ? { ...msg, isRead: true } : msg));
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveReview = async (id) => {
    try {
      await approveReview(id);
      setPendingReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectReview = async (id) => {
    if (!confirm('Are you sure you want to reject and delete this review?')) return;
    try {
      await deleteReview(id);
      setPendingReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', background: '#F5F5F5' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', color: '#111827' }}>Marketing & Communications</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Engage with your customers through SMS, Email, and WhatsApp campaigns.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem', marginBottom: '2rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1rem',
              background: activeTab === tab.id ? '#111827' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#4B5563',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', padding: '2rem', borderRadius: '1rem', border: '1px solid #E5E7EB', minHeight: '500px' }}>
        {activeTab === 'campaigns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <div style={{ width: '100%' }}>
              <h3 style={{ marginTop: 0 }}>Draft a New Campaign</h3>
              <p style={{ color: '#6B7280', fontSize: '13px' }}>Use the panel to send bulk notifications directly to your customers.</p>
              <div style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Wrap BulkNotifyPanel to match its styling expectations */}
                <div className="pos-order-panel" style={{ width: '100%', border: 'none', boxShadow: 'none' }}>
                  <BulkNotifyPanel onToast={(type, title, msg) => alert(`${title}: ${msg}`)} />
                </div>
              </div>
            </div>
            <div style={{ width: '100%' }}>
              <h3 style={{ marginTop: 0 }}>Recent Campaigns</h3>
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', background: '#F9FAFB', borderRadius: '8px' }}>
                No recent campaigns.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'segments' && (
          <div>
            <h3 style={{ marginTop: 0 }}>Customer Segments</h3>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Target specific groups of customers for higher conversion rates.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              {['High Value Customers', 'Inactive (30+ days)', 'Newsletter Subscribers', 'VIP Members'].map(seg => (
                <div key={seg} style={{ padding: '1.5rem', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{seg}</h4>
                  <span style={{ fontSize: '12px', color: '#10B981', background: '#ECFDF5', padding: '2px 6px', borderRadius: '4px' }}>Ready</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'automations' && (
          <div>
            <h3 style={{ marginTop: 0 }}>Automated Workflows</h3>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Set up triggers to automatically engage customers.</p>
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', border: '2px dashed #E5E7EB', borderRadius: '8px', marginTop: '2rem' }}>
              <div style={{ fontSize: '32px', marginBottom: '1rem' }}>⚙️</div>
              <strong>Automations coming soon!</strong>
              <div style={{ fontSize: '13px', marginTop: '0.5rem' }}>Features like Abandoned Cart reminders and Birthday SMS will be available here.</div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h3 style={{ marginTop: 0 }}>Pending Product Reviews</h3>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Approve or reject customer reviews before they appear on the storefront.</p>
            
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loadingReviews ? (
                <p>Loading reviews...</p>
              ) : pendingReviews.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#F9FAFB', borderRadius: '8px', color: '#6B7280' }}>
                  No pending reviews to moderate.
                </div>
              ) : (
                pendingReviews.map(review => (
                  <div key={review.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '16px' }}>{review.reviewerName}</strong>
                        <span style={{ color: '#F59E0B' }}>
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '1rem' }}>Product ID: {review.productId}</div>
                      <p style={{ margin: 0, color: '#374151', lineHeight: '1.5' }}>"{review.comment}"</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleApproveReview(review.id)}
                        style={{ background: '#10B981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRejectReview(review.id)}
                        style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div>
            <h3 style={{ marginTop: 0 }}>Customer Inquiries</h3>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Messages submitted via the Storefront contact form.</p>
            
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loadingInquiries ? (
                <p>Loading messages...</p>
              ) : inquiries.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#F9FAFB', borderRadius: '8px', color: '#6B7280' }}>
                  No customer messages found.
                </div>
              ) : (
                inquiries.map(msg => (
                  <div key={msg.id} style={{ 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px', 
                    padding: '1.5rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    background: msg.isRead ? '#F9FAFB' : '#fff',
                    borderLeft: msg.isRead ? '1px solid #E5E7EB' : '4px solid #C0392B'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '16px', color: '#111827' }}>{msg.name}</strong>
                        <a href={`mailto:${msg.email}`} style={{ fontSize: '14px', color: '#3B82F6', textDecoration: 'none' }}>{msg.email}</a>
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: '12px 0 0', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {msg.message}
                      </p>
                    </div>
                    {!msg.isRead && (
                      <button 
                        onClick={() => handleMarkInquiryRead(msg.id)}
                        style={{ background: '#F3F4F6', color: '#4B5563', border: '1px solid #D1D5DB', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <CommunityTab />
        )}
      </div>
    </div>
  );
}

