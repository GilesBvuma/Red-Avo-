'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import { useCart } from '@/context/CartContext';
import PaymentMethods from '@/components/PaymentMethods/PaymentMethods';
import FloatingLines from '@/components/FloatingLines/FloatingLines';
import styles from './cart.module.css';

const CART_VIDEOS = [
  '/videos/cart1.mp4',
  '/videos/cart2.mp4',
  '/videos/cart3.mp4',
  '/videos/cart4.mp4'
];

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
  
  const [videoIndex, setVideoIndex] = useState(0);

  useEffect(() => {
    // Cycle background videos every 5 seconds
    const interval = setInterval(() => {
      setVideoIndex(prev => (prev + 1) % CART_VIDEOS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.page}>
      <Nav />
      <main className={styles.main}>
        {/* Left Side Background Section */}
        <div className={styles.leftBackground} aria-hidden="true">
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

        {/* Left Side / Foreground Card */}
        <div className={styles.contentCard}>
          <h1>Your Cart</h1>
          
          {cartItems.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Your cart is empty.</p>
              <Link href="/shop" className={styles.continueBtn}>Continue Shopping</Link>
            </div>
          ) : (
            <div className={styles.layout}>
              <div className={styles.cartList}>
                {cartItems.map(item => (
                  <div key={item.variant.id} className={styles.cartItem}>
                    <img 
                      src={item.product.imageUrl ? `${process.env.NEXT_PUBLIC_MEDIA_URL || ''}${item.product.imageUrl}` : 'https://placehold.co/100x100?text=No+Image'} 
                      alt={item.product.name} 
                      className={styles.itemImage}
                    />
                    <div className={styles.itemInfo}>
                      <h3>{item.product.name}</h3>
                      <p className={styles.variantInfo}>{item.variant.color} - {item.variant.size}</p>
                      <p className={styles.price}>${(item.variant.sellPrice > 0 ? item.variant.sellPrice : (item.product.price || 0)).toFixed(2)}</p>
                    </div>
                    <div className={styles.actions}>
                      <div className={styles.qtyControl}>
                        <button onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                          disabled={item.quantity >= item.variant.stockQuantity}
                        >+</button>
                      </div>
                      <button className={styles.removeBtn} onClick={() => removeFromCart(item.variant.id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={styles.summary}>
                <h2>Order Summary</h2>
                <div className={`${styles.summaryRow} ${styles.total}`}>
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                
                <Link href="/checkout" className={styles.checkoutBtn}>
                  Proceed to Checkout
                </Link>
                <PaymentMethods />
              </div>
            </div>
          )}
        </div>

        {/* Right Side / Background Video */}
        <div className={styles.videoBackground} aria-hidden="true">
          {CART_VIDEOS.map((src, index) => (
            <video
              key={src}
              src={src}
              autoPlay
              loop
              muted
              playsInline
              className={styles.bgVideo}
              style={{ opacity: videoIndex === index ? 1 : 0 }}
            />
          ))}
          <div className={styles.videoOverlay} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
