'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('storefront_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('storefront_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // ── Standard product item ──────────────────────────────────────────────────
  const addToCart = (product, variant, qty = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => !item.isGiftCard && item.variant.id === variant.id);
      if (existing) {
        return prev.map(item =>
          (!item.isGiftCard && item.variant.id === variant.id)
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, variant, quantity: qty }];
    });
  };

  // ── Gift card item ─────────────────────────────────────────────────────────
  // Gift cards are unique per recipient email — each is a separate line item.
  const addGiftCardToCart = (giftCard) => {
    // giftCard: { amount, recipientName, recipientEmail, purchaserName, purchaserEmail, personalMessage, recipientBirthday, cardDesign }
    const cartKey = `gc_${giftCard.recipientEmail}_${Date.now()}`;
    setCartItems(prev => [
      ...prev,
      {
        isGiftCard: true,
        cartKey,
        ...giftCard,
        quantity: 1,
      }
    ]);
  };

  const removeFromCart = (id) => {
    // id is variantId for products or cartKey for gift cards
    setCartItems(prev =>
      prev.filter(item => item.isGiftCard ? item.cartKey !== id : item.variant.id !== id)
    );
  };

  const updateQuantity = (variantId, qty) => {
    if (qty <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCartItems(prev => prev.map(item =>
      (!item.isGiftCard && item.variant.id === variantId) ? { ...item, quantity: qty } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((acc, item) => {
    if (item.isGiftCard) return acc + Number(item.amount);
    const price = item.variant.sellPrice > 0 ? item.variant.sellPrice : (item.product.price || 0);
    return acc + (price * item.quantity);
  }, 0);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      addGiftCardToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
