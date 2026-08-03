'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import { useCart } from '@/context/CartContext';
import styles from './GiftCardShop.module.css';

const TIER_DESIGNS = {
  1: {
    bg: 'linear-gradient(135deg, #5E080C 0%, #8F0D13 60%, #c0392b 100%)',
    textColor: '#fff',
    accent: 'rgba(255,255,255,0.15)',
  },
  2: {
    bg: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 60%, #444 100%)',
    textColor: '#fff',
    accent: 'rgba(255,255,255,0.1)',
  },
  3: {
    bg: 'linear-gradient(135deg, #f3efe4 0%, #e8e0d0 100%)',
    textColor: '#2a2a28',
    accent: 'rgba(0,0,0,0.06)',
  },
  4: {
    bg: 'linear-gradient(135deg, #d4778a 0%, #c0392b 60%, #8F0D13 100%)',
    textColor: '#fff',
    accent: 'rgba(255,255,255,0.15)',
  },
};

export default function GiftCardShopPage() {
  const router = useRouter();
  const { addGiftCardToCart } = useCart();

  const [tiers, setTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [selectedTierId, setSelectedTierId] = useState(null);

  const [form, setForm] = useState({
    purchaserName: '',
    purchaserEmail: '',
    recipientName: '',
    recipientEmail: '',
    personalMessage: '',
    recipientBirthday: '',
  });
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  // Fetch tiers on mount
  useEffect(() => {
    fetch('/api/gift-cards/tiers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTiers(data);
          if (data.length > 0) setSelectedTierId(data[0].id);
        } else {
          console.error('Invalid response format for tiers', data);
        }
        setLoadingTiers(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingTiers(false);
      });
  }, []);

  const selectedTier = tiers.find(t => t.id === selectedTierId);
  const design = selectedTier ? TIER_DESIGNS[selectedTier.tierLevel] || TIER_DESIGNS[1] : TIER_DESIGNS[1];

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddToCart = () => {
    if (!selectedTier) {
      setError('Please select a gift card tier.');
      return;
    }
    if (!form.purchaserName || !form.purchaserEmail || !form.recipientName || !form.recipientEmail) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.purchaserEmail) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recipientEmail)) {
      setError('Please enter valid email addresses.');
      return;
    }

    addGiftCardToCart({
      tierId: selectedTier.id,
      tierName: selectedTier.name,
      amount: selectedTier.priceAmount,
      ...form,
    });

    setAdded(true);
    setError('');
  };

  if (added) {
    return (
      <>
        <Nav />
        <main className={styles.page}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>🎁</div>
            <h1 className={styles.successTitle}>Gift Card Added!</h1>
            <p className={styles.successText}>
              Your <strong>{selectedTier?.name} (${selectedTier?.priceAmount.toFixed(2)})</strong> gift card for <strong>{form.recipientName}</strong> is in your cart.
            </p>
            <p className={styles.successSub}>It will be emailed to <em>{form.recipientEmail}</em> after payment is completed.</p>
            <div className={styles.successActions}>
              <button onClick={() => { setAdded(false); setForm({ purchaserName:'', purchaserEmail:'', recipientName:'', recipientEmail:'', personalMessage:'', recipientBirthday:'' }); }} className={styles.btnSecondary}>
                Add Another
              </button>
              <button onClick={() => router.push('/checkout')} className={styles.btnPrimary}>
                Checkout
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className={styles.page}>

        {/* Hero */}
        <section className={styles.hero}>
          <video
            autoPlay
            loop
            muted
            playsInline
            className={styles.heroVideo}
            src="/videos/Gift%20cards.mp4"
          />
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroInner}>
            <p className={styles.heroEyebrow}>The perfect gift</p>
            <h1 className={styles.heroTitle}>RedAvo Gift Cards</h1>
            <p className={styles.heroSub}>Give the gift of confidence — delivered instantly by email, never expires.</p>
          </div>
        </section>

        <div className={styles.content}>

          {/* Design Picker */}
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>1. Select your Tier</h2>
            {loadingTiers ? (
              <p>Loading available tiers...</p>
            ) : (
              <div className={styles.designGrid}>
                {tiers.map(t => {
                  const d = TIER_DESIGNS[t.tierLevel] || TIER_DESIGNS[1];
                  return (
                    <button
                      key={t.id}
                      className={`${styles.designCard} ${selectedTierId === t.id ? styles.designCardActive : ''}`}
                      onClick={() => setSelectedTierId(t.id)}
                      aria-label={t.name}
                    >
                      {/* Card preview */}
                      <div className={styles.cardPreview} style={t.imageUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${t.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: d.bg }}>
                        <div className={styles.cardPreviewLogo}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/images/logo2.png" alt="RedAvo" width={32} height={32} />
                        </div>
                        <div className={styles.cardPreviewCode} style={{ color: d.textColor }}>
                          GC-XXXX-XXXX-XXXX
                        </div>
                        <div className={styles.cardPreviewBalance} style={{ color: d.textColor }}>
                          ${t.priceAmount.toFixed(2)}
                        </div>
                      </div>
                      <span className={styles.designLabel}>{t.name}</span>
                      {selectedTierId === t.id && <span className={styles.designCheck}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Live card preview */}
          <div className={styles.livePreviewWrap}>
            <div className={styles.liveCard} style={selectedTier?.imageUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${selectedTier.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: design.bg }}>
              <div className={styles.liveCardTop}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logo2.png" alt="RedAvo" width={48} height={48} className={styles.liveCardLogo} />
                <span className={styles.liveCardBrand} style={{ color: design.textColor }}>RedAvo Activewear</span>
              </div>
              <div className={styles.liveCardCode} style={{ color: design.textColor, background: design.accent }}>
                GC-XXXX-XXXX-XXXX
              </div>
              <div className={styles.liveCardBottom} style={{ color: design.textColor }}>
                <span>{form.recipientName || 'Recipient Name'}</span>
                <span className={styles.liveCardAmount}>${selectedTier ? selectedTier.priceAmount.toFixed(2) : '0.00'}</span>
              </div>
              <p className={styles.liveCardExpiry} style={{ color: design.textColor }}>{selectedTier ? selectedTier.name : 'Digital gift card'}</p>
            </div>
          </div>

          {/* Details form */}
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>2. Fill in the details</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="purchaserName">Your Name <span className={styles.req}>*</span></label>
                <input id="purchaserName" name="purchaserName" type="text" value={form.purchaserName} onChange={handleChange} placeholder="Your full name" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="purchaserEmail">Your Email <span className={styles.req}>*</span></label>
                <input id="purchaserEmail" name="purchaserEmail" type="email" value={form.purchaserEmail} onChange={handleChange} placeholder="you@example.com" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="recipientName">Recipient Name <span className={styles.req}>*</span></label>
                <input id="recipientName" name="recipientName" type="text" value={form.recipientName} onChange={handleChange} placeholder="Who is this for?" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="recipientEmail">Recipient Email <span className={styles.req}>*</span></label>
                <input id="recipientEmail" name="recipientEmail" type="email" value={form.recipientEmail} onChange={handleChange} placeholder="their@email.com" required />
              </div>
              <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                <label htmlFor="personalMessage">Personal Message <span className={styles.optional}>(optional)</span></label>
                <textarea id="personalMessage" name="personalMessage" rows={3} value={form.personalMessage} onChange={handleChange} placeholder="Write a personal note..." />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="recipientBirthday">Recipient's Birthday <span className={styles.optional}>(optional — we'll remind them on their big day!)</span></label>
                <input id="recipientBirthday" name="recipientBirthday" type="date" value={form.recipientBirthday} onChange={handleChange} />
              </div>
            </div>
          </section>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <a href="/gift-card" className={styles.btnBack}>← Back</a>
            <button className={styles.btnPrimary} onClick={handleAddToCart} id="gc-add-to-cart">
              Add to Cart
            </button>
          </div>

          {/* How it works */}
          <section className={styles.howItWorks}>
            <h3 className={styles.howTitle}>How it works</h3>
            <div className={styles.howSteps}>
              <div className={styles.howStep}>
                <span className={styles.howNum}>1</span>
                <p>You pay — we generate a unique code instantly</p>
              </div>
              <div className={styles.howStep}>
                <span className={styles.howNum}>2</span>
                <p>Recipient gets a beautiful email with their code</p>
              </div>
              <div className={styles.howStep}>
                <span className={styles.howNum}>3</span>
                <p>They enter the code at checkout — balance applied automatically</p>
              </div>
              <div className={styles.howStep}>
                <span className={styles.howNum}>4</span>
                <p>Unused balance carries over — never expires</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
