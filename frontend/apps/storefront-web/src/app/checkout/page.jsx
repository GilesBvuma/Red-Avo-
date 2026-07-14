'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import { useCart } from '@/context/CartContext';
import { initiatePaynowCheckout } from '@/lib/api';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    deliveryMethod: 'DELIVERY', // or 'COLLECTION'
    address: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tax = cartTotal * 0.15;
  const total = cartTotal + tax;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderItems = cartItems.map(item => ({
        productId: item.product.id,
        variantId: item.variant.id,
        quantity: item.quantity,
        price: item.variant.sellPrice > 0 ? item.variant.sellPrice : (item.product.price || 0)
      }));

      const payload = {
        amount: total,
        email: formData.email,
        customerName: formData.name,
        phone: formData.phone,
        deliveryMethod: formData.deliveryMethod,
        deliveryAddress: formData.deliveryMethod === 'DELIVERY' ? formData.address : null,
        items: orderItems
      };

      const res = await initiatePaynowCheckout(payload);
      
      if (res.redirectUrl) {
        // Clear cart since order is placed (PENDING_PAYMENT in backend)
        clearCart();
        // Redirect to PayNow
        window.location.href = res.redirectUrl;
      } else {
        setError('Payment initiation failed. Please try again.');
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
      <main className={styles.main}>
        <h1>Checkout</h1>
        
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
              <div className={styles.inputGroup}>
                <label>Delivery Address</label>
                <textarea 
                  name="address" 
                  required 
                  value={formData.address} 
                  onChange={handleChange} 
                  rows={3}
                />
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Processing...' : 'Pay with PayNow'}
            </button>
          </form>
          
          <div className={styles.summary}>
             <h2>Order Summary</h2>
             <div className={styles.items}>
               {cartItems.map(item => {
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
              <div className={styles.summaryRow}>
                <span>VAT (15%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
