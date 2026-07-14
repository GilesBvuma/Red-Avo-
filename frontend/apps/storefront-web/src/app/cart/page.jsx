'use client';

import React from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import { useCart } from '@/context/CartContext';
import styles from './cart.module.css';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
  const tax = cartTotal * 0.15; // 15% VAT
  const total = cartTotal + tax;

  return (
    <div className={styles.page}>
      <Nav />
      <main className={styles.main}>
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
                    src={item.product.imageUrl ? `http://localhost:3000${item.product.imageUrl}` : 'https://placehold.co/100x100?text=No+Image'} 
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
              
              <Link href="/checkout" className={styles.checkoutBtn}>
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
