'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import { useCart } from '@/context/CartContext';
import { initiatePaynowCheckout, createOrder } from '@/lib/api';
import { DELIVERY_ZONES } from '@/lib/deliveryZones';
import PaymentMethods from '@/components/PaymentMethods/PaymentMethods';
import FloatingLines from '@/components/FloatingLines/FloatingLines';
import { getStoredUtm } from '@/hooks/useUtm';
import { usePixel } from '@/hooks/usePixel';
import { saveAbandonedCartSnapshot, clearAbandonedCart } from '@/hooks/useAbandonedCart';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const { track } = usePixel();

  // Fire InitiateCheckout once when checkout page mounts with items
  useEffect(() => {
    if (cartItems.length > 0) {
      track('InitiateCheckout', {
        num_items: cartItems.reduce((s, i) => s + i.quantity, 0),
        value:     parseFloat(cartTotal.toFixed(2)),
        currency:  'USD',
        content_ids: cartItems
          .filter(i => !i.isGiftCard)
          .map(i => String(i.product.id)),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    deliveryMethod: 'DELIVERY', // or 'COLLECTION'
    paymentMethod: 'PAYNOW', // or 'COD'
    country: 'Zimbabwe',
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    apartment: '',
    city: '',
    deliveryZone: DELIVERY_ZONES[0].id,
    postalCode: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Gift card state
  const [gcCode, setGcCode] = useState('');
  const [gcApplied, setGcApplied] = useState(null); // { code, amountApplied, remainingBalance }
  const [gcError, setGcError] = useState('');
  const [gcLoading, setGcLoading] = useState(false);

  const selectedZone = DELIVERY_ZONES.find(z => z.id === formData.deliveryZone) || DELIVERY_ZONES[0];
  const deliveryFee = formData.deliveryMethod === 'DELIVERY' ? selectedZone.fee : 0;
  const gcDiscount = gcApplied ? Math.min(gcApplied.amountApplied, cartTotal + deliveryFee) : 0;
  const total = Math.max(0, cartTotal + deliveryFee - gcDiscount);

  const handleApplyGiftCard = async () => {
    if (!gcCode.trim()) return;
    setGcLoading(true);
    setGcError('');
    try {
      const res = await fetch(`/api/gift-cards/validate/${encodeURIComponent(gcCode.trim())}`);
      const data = await res.json();
      if (!data.valid) {
        setGcError(data.status === 'REDEEMED' ? 'This gift card has been fully redeemed.' :
                   data.status === 'VOIDED' ? 'This gift card has been voided.' :
                   data.status === 'PENDING' ? 'This gift card is still processing.' :
                   'Invalid gift card code.');
        return;
      }
      const available = Number(data.remainingBalance);
      const toApply = Math.min(available, cartTotal + deliveryFee);
      setGcApplied({ code: gcCode.trim().toUpperCase(), amountApplied: toApply, remainingBalance: available });
    } catch {
      setGcError('Could not validate gift card. Please try again.');
    } finally {
      setGcLoading(false);
    }
  };

  const handleChange = (e) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Snapshot for abandoned-cart recovery whenever email is filled
    if (e.target.name === 'email' && e.target.value.includes('@')) {
      saveAbandonedCartSnapshot(e.target.value, formData.name, cartItems);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderItems = cartItems.filter(i => !i.isGiftCard).map(item => {
        const itemPrice = item.variant.sellPrice > 0 ? item.variant.sellPrice : (item.product.price || 0);
        return {
          productId: item.product.id,
          variantId: item.variant.id,
          productName: `${item.product.name} (${item.variant.size} - ${item.variant.color})`,
          quantity: item.quantity,
          unitPrice: itemPrice,
          lineTotal: itemPrice * item.quantity
        };
      });

      const giftCards = cartItems.filter(i => i.isGiftCard).map(gc => ({
        tierId: gc.tierId,
        amount: gc.amount,
        purchaserName: gc.purchaserName,
        purchaserEmail: gc.purchaserEmail,
        recipientName: gc.recipientName,
        recipientEmail: gc.recipientEmail,
        personalMessage: gc.personalMessage,
        recipientBirthday: gc.recipientBirthday
      }));

      // ── Attach UTM attribution captured on landing ─────────────────
      const utm = getStoredUtm();

      const payload = {
        amount: total,
        email: formData.email,
        customerName: formData.name,
        phone: formData.phone,
        deliveryMethod: formData.deliveryMethod,
        paymentMethod: formData.paymentMethod,
        deliveryAddress: formData.deliveryMethod === 'DELIVERY' 
          ? `[Zone: ${selectedZone.name}] ${formData.firstName} ${formData.lastName}, ${formData.company ? formData.company + ', ' : ''}${formData.address}, ${formData.apartment ? formData.apartment + ', ' : ''}${formData.city}, ${formData.country}, ${formData.postalCode}` 
          : null,
        deliveryFee: deliveryFee,
        items: orderItems,
        giftCards: giftCards,
        // UTM fields — null-safe; only present if captured
        utmSource:   utm?.utm_source   ?? null,
        utmMedium:   utm?.utm_medium   ?? null,
        utmCampaign: utm?.utm_campaign ?? null,
        utmContent:  utm?.utm_content  ?? null,
      };

      if (formData.paymentMethod === 'COD' || total === 0) {
        const result = await createOrder(payload);
        clearCart();
        clearAbandonedCart(); // purchase complete — cancel any pending recovery
        // ── Pixel: Purchase ────────────────────────────────
        track('Purchase', {
          value:       parseFloat(total.toFixed(2)),
          currency:    'USD',
          content_ids: orderItems.map(i => String(i.productId)),
          content_type: 'product',
          order_id:    result?.id ? String(result.id) : undefined,
        });
        setSuccessMessage('Order placed successfully! We will contact you soon for delivery/collection.');
      } else {
        const res = await initiatePaynowCheckout(payload);
        if (res.redirectUrl) {
          clearCart();
          clearAbandonedCart(); // purchase complete — cancel any pending recovery
          // ── Pixel: Purchase fires before redirect (PayNow handles redirect)
          track('Purchase', {
            value:       parseFloat(total.toFixed(2)),
            currency:    'USD',
            content_ids: orderItems.map(i => String(i.productId)),
            content_type: 'product',
          });
          window.location.href = res.redirectUrl;
        } else {
          setError('Payment initiation failed. Please try again.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className={styles.page}>
        <Nav />
        <main className={styles.main}>
          <div className={styles.empty}>
            <h2>Your cart is empty.</h2>
            <button onClick={() => router.push('/shop')} className={styles.btn}>Back to Shop</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Nav />
      <div className={styles.floatingBg} aria-hidden="true">
        <FloatingLines 
          enabledWaves={["middle","top"]}
          lineCount={8}
          lineDistance={8}
          bendRadius={8}
          bendStrength={-2}
          interactive={true}
          parallax={true}
          animationSpeed={2.4}
          linesGradient={["#EC4899", "#b97575", "#6a6a6a"]}
        />
      </div>
      <main className={styles.main}>
        <h1>Checkout</h1>
        
        {successMessage ? (
          <div className={styles.empty}>
            <h2>{successMessage}</h2>
            <button onClick={() => router.push('/shop')} className={styles.btn} style={{marginTop: '24px'}}>Continue Shopping</button>
          </div>
        ) : (
        <div className={styles.layout}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <h2>Customer Details</h2>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Email Address</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Phone Number</label>
              <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} />
            </div>

            <h2>Payment Method</h2>
            <div className={styles.radioGroup} style={{marginBottom: '32px'}}>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="PAYNOW" 
                  checked={formData.paymentMethod === 'PAYNOW'}
                  onChange={handleChange}
                />
                PayNow (EcoCash / InnBucks / Cards)
              </label>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="COD" 
                  checked={formData.paymentMethod === 'COD'}
                  onChange={handleChange}
                />
                Cash on Delivery (COD) / Pay on Collection
              </label>
            </div>

            <h2>Delivery Method</h2>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="deliveryMethod" 
                  value="DELIVERY" 
                  checked={formData.deliveryMethod === 'DELIVERY'}
                  onChange={handleChange}
                />
                Delivery
              </label>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="deliveryMethod" 
                  value="COLLECTION" 
                  checked={formData.deliveryMethod === 'COLLECTION'}
                  onChange={handleChange}
                />
                In-store Collection
              </label>
            </div>

            {formData.deliveryMethod === 'DELIVERY' && (
              <div className={styles.deliveryForm}>
                <div className={styles.inputGroup}>
                  <label>Country/Region</label>
                  <select name="country" value={formData.country} onChange={handleChange}>
                    <option value="Zimbabwe">Zimbabwe</option>
                    <option value="South Africa">South Africa</option>
                  </select>
                </div>
                
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>First name</label>
                    <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Last name</label>
                    <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Company (optional)</label>
                  <input type="text" name="company" value={formData.company} onChange={handleChange} />
                </div>

                <div className={styles.inputGroup}>
                  <label>Address</label>
                  <input type="text" name="address" required value={formData.address} onChange={handleChange} />
                </div>

                <div className={styles.inputGroup}>
                  <label>Apartment, suite, etc. (optional)</label>
                  <input type="text" name="apartment" value={formData.apartment} onChange={handleChange} />
                </div>

                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label>City</label>
                    <input type="text" name="city" required value={formData.city} onChange={handleChange} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Province / Zone</label>
                    <select name="deliveryZone" value={formData.deliveryZone} onChange={handleChange} required>
                      {DELIVERY_ZONES.map(zone => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} (${zone.fee.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Postal code</label>
                    <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Gift Card Panel ────────────────────── */}
            <div className={styles.gcPanel}>
              <details open={!!gcApplied}>
                <summary className={styles.gcSummary}>🎁 Have a Gift Card?</summary>
                <div className={styles.gcBody}>
                  {!gcApplied ? (
                    <>
                      <div className={styles.gcInputRow}>
                        <input
                          type="text"
                          placeholder="GC-XXXX-XXXX-XXXX"
                          value={gcCode}
                          onChange={e => { setGcCode(e.target.value.toUpperCase()); setGcError(''); }}
                          className={styles.gcInput}
                          maxLength={20}
                        />
                        <button type="button" onClick={handleApplyGiftCard} className={styles.gcApplyBtn} disabled={gcLoading}>
                          {gcLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {gcError && <p className={styles.gcError}>{gcError}</p>}
                    </>
                  ) : (
                    <div className={styles.gcApplied}>
                      <span>✓ <strong>{gcApplied.code}</strong> — <span style={{color:'#8F0D13'}}>−${gcApplied.amountApplied.toFixed(2)}</span> applied</span>
                      <button type="button" onClick={() => { setGcApplied(null); setGcCode(''); }} className={styles.gcRemove}>Remove</button>
                    </div>
                  )}
                </div>
              </details>
            </div>

            {total === 0 ? (
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Completing Order...' : 'Complete Order (No payment needed)'}
              </button>
            ) : formData.paymentMethod === 'COD' ? (
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Processing...' : `Place Order • Pay $${total.toFixed(2)} Later`}
              </button>
            ) : (
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Processing...' : `Pay $${total.toFixed(2)} with PayNow`}
              </button>
            )}
            <PaymentMethods />
          </form>
          
          <div className={styles.summary}>
             <h2>Order Summary</h2>
             <div className={styles.items}>
               {cartItems.map(item => {
                 if (item.isGiftCard) {
                   return (
                     <div key={item.cartKey} className={styles.summaryItem}>
                       <span>1x {item.tierName || 'Gift Card'} (Digital)</span>
                       <span>${Number(item.amount).toFixed(2)}</span>
                     </div>
                   );
                 }
                 const price = item.variant.sellPrice > 0 ? item.variant.sellPrice : (item.product.price || 0);
                 return (
                   <div key={item.variant.id} className={styles.summaryItem}>
                     <span>{item.quantity}x {item.product.name} ({item.variant.size})</span>
                     <span>${(price * item.quantity).toFixed(2)}</span>
                   </div>
                 );
               })}
             </div>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              {formData.deliveryMethod === 'DELIVERY' && (
                <div className={styles.summaryRow}>
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {gcApplied && (
                <div className={styles.summaryRow} style={{color:'#8F0D13'}}>
                  <span>🎁 Gift Card ({gcApplied.code})</span>
                  <span>−${gcApplied.amountApplied.toFixed(2)}</span>
                </div>
              )}
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
          </div>
        </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
