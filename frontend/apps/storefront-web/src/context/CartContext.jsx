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

  const addToCart = (product, variant, qty = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.variant.id === variant.id);
      if (existing) {
        return prev.map(item =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, variant, quantity: qty }];
    });
  };

  const removeFromCart = (variantId) => {
    setCartItems(prev => prev.filter(item => item.variant.id !== variantId));
  };

  const updateQuantity = (variantId, qty) => {
    if (qty <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCartItems(prev => prev.map(item =>
      item.variant.id === variantId ? { ...item, quantity: qty } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((acc, item) => {
    const price = item.variant.sellPrice > 0 ? item.variant.sellPrice : (item.product.price || 0);
    return acc + (price * item.quantity);
  }, 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
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
