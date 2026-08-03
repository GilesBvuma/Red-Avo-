'use client';

import { useState, useEffect } from 'react';
import * as api from '../lib/api';
import styles from './GiftCardsPage.module.css';

export default function GiftCardsPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLedgerId, setActiveLedgerId] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);

  // Tiers
  const [tiers, setTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [editingTier, setEditingTier] = useState(null); // ID of tier being edited
  const [editTierForm, setEditTierForm] = useState({ name: '', priceAmount: '', imageUrl: '', uploadFile: null });

  useEffect(() => {
    loadCards();
    loadTiers();
  }, []);

  const loadTiers = async () => {
    setLoadingTiers(true);
    try {
      const data = await api.fetchTiers();
      setTiers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTiers(false);
    }
  };

  const handleEditTier = (t) => {
    setEditingTier(t.id);
    setEditTierForm({ name: t.name, priceAmount: t.priceAmount, imageUrl: t.imageUrl || '', uploadFile: null });
  };

  const handleSaveTier = async (id) => {
    try {
      let finalImageUrl = editTierForm.imageUrl;
      if (editTierForm.uploadFile) {
        const res = await api.uploadCommunityFile(editTierForm.uploadFile, 'media');
        finalImageUrl = res.url;
      }
      await api.updateTier(id, { name: editTierForm.name, priceAmount: editTierForm.priceAmount, imageUrl: finalImageUrl });
      setEditingTier(null);
      loadTiers();
    } catch (err) {
      alert('Failed to update tier: ' + err.message);
    }
  };

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await api.fetchGiftCards();
      setCards(data.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoid = async (id) => {
    if (!confirm('Are you sure you want to void this gift card?')) return;
    try {
      await api.voidGiftCard(id);
      loadCards();
    } catch (err) {
      alert('Failed to void card: ' + err.message);
    }
  };

  const handleRelease = async (id) => {
    if (!confirm('Are you sure you want to release this gift card early?')) return;
    try {
      await api.releaseGiftCard(id);
      loadCards();
    } catch (err) {
      alert('Failed to release card: ' + err.message);
    }
  };

  const viewLedger = async (id) => {
    if (activeLedgerId === id) {
      setActiveLedgerId(null);
      return;
    }
    setActiveLedgerId(id);
    try {
      const data = await api.fetchGiftCardLedger(id);
      setLedgerData(data);
    } catch (err) {
      alert('Failed to load ledger: ' + err.message);
      setActiveLedgerId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gift Cards</h1>
        <button onClick={() => { loadCards(); loadTiers(); }} className={styles.refreshBtn}>Refresh</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* ── Tiers Configuration ── */}
      <div className={styles.sectionHeader}>
        <h2>Tier Configuration</h2>
      </div>
      <div className={styles.tableWrap} style={{ marginBottom: '32px' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Name (e.g. Standard, Gold)</th>
              <th>Price Amount ($)</th>
              <th>Custom Background</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingTiers ? <tr><td colSpan="4" className={styles.loading}>Loading tiers...</td></tr> : 
             tiers.map(t => (
              <tr key={t.id}>
                <td>Tier {t.tierLevel}</td>
                <td>
                  {editingTier === t.id ? (
                    <input 
                      className={styles.editInput}
                      value={editTierForm.name} 
                      onChange={e => setEditTierForm({ ...editTierForm, name: e.target.value })} 
                    />
                  ) : (
                    t.name
                  )}
                </td>
                <td>
                  {editingTier === t.id ? (
                    <input 
                      type="number" 
                      step="0.01" 
                      className={styles.editInput}
                      value={editTierForm.priceAmount} 
                      onChange={e => setEditTierForm({ ...editTierForm, priceAmount: e.target.value })} 
                    />
                  ) : (
                    `$${t.priceAmount.toFixed(2)}`
                  )}
                </td>
                <td>
                  {editingTier === t.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {editTierForm.uploadFile ? (
                        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>New file selected</span>
                      ) : editTierForm.imageUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={editTierForm.imageUrl} alt="preview" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                          <button onClick={() => setEditTierForm({ ...editTierForm, imageUrl: '' })} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Clear</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>No custom image</span>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => setEditTierForm({ ...editTierForm, uploadFile: e.target.files[0] })}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  ) : (
                    t.imageUrl ? (
                      <img src={t.imageUrl} alt={t.name} style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Default</span>
                    )
                  )}
                </td>
                <td>
                  {editingTier === t.id ? (
                    <div className={styles.actions}>
                      <button onClick={() => handleSaveTier(t.id)} className={styles.actionBtn} style={{ background: '#064e3b', color: '#34d399' }}>Save</button>
                      <button onClick={() => setEditingTier(null)} className={styles.actionBtn}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => handleEditTier(t)} className={styles.actionBtn}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Issued Gift Cards ── */}
      <div className={styles.sectionHeader}>
        <h2>Issued Gift Cards</h2>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Status</th>
              <th>Balance</th>
              <th>Purchaser</th>
              <th>Recipient</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="7" className={styles.loading}>Loading...</td></tr>}
            {!loading && cards.length === 0 && <tr><td colSpan="7" className={styles.empty}>No gift cards found.</td></tr>}
            {!loading && cards.map(card => {
              const isPending = card.status === 'PENDING';
              return (
                <tr key={card.id} className={isPending ? styles.rowPending : ''}>
                  <td className={styles.codeCell}>{card.code}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles['status' + card.status]}`}>
                      {card.status}
                    </span>
                    {isPending && card.releaseAt && (
                      <div className={styles.releaseInfo}>
                        Auto-releases at {new Date(card.releaseAt).toLocaleTimeString()}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className={styles.balanceInfo}>
                      <span className={styles.remainingBalance}>${card.remainingBalance.toFixed(2)}</span>
                      <span className={styles.initialBalance}>/ ${card.initialBalance.toFixed(2)}</span>
                    </div>
                  </td>
                  <td>{card.purchaserEmail}</td>
                  <td>{card.recipientEmail}</td>
                  <td>{new Date(card.purchasedAt).toLocaleDateString()}</td>
                  <td className={styles.actions}>
                    <button onClick={() => viewLedger(card.id)} className={styles.actionBtn}>
                      Ledger
                    </button>
                    {isPending && (
                      <button onClick={() => handleRelease(card.id)} className={`${styles.actionBtn} ${styles.actionRelease}`}>
                        Release Now
                      </button>
                    )}
                    {card.status !== 'VOIDED' && (
                      <button onClick={() => handleVoid(card.id)} className={`${styles.actionBtn} ${styles.actionVoid}`}>
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ledger Modal */}
      {activeLedgerId && (
        <div className={styles.modalOverlay} onClick={() => setActiveLedgerId(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Redemption Ledger</h3>
              <button onClick={() => setActiveLedgerId(null)} className={styles.closeBtn}>×</button>
            </div>
            <div className={styles.modalBody}>
              {ledgerData.length === 0 ? (
                <p>No redemptions yet.</p>
              ) : (
                <table className={styles.ledgerTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Order ID</th>
                      <th>Amount Used</th>
                      <th>Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.map(entry => (
                      <tr key={entry.id}>
                        <td>{new Date(entry.redeemedAt).toLocaleString()}</td>
                        <td>{entry.orderId || '-'}</td>
                        <td className={styles.ledgerAmount}>-${entry.amountUsed.toFixed(2)}</td>
                        <td>${entry.balanceAfter.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
