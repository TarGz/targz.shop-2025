import { useState, useEffect } from 'preact/hooks';

interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
}

interface CartProps {
  directusUrl: string;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export default function Cart({ directusUrl }: CartProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cart');
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch {
      setCartItems([]);
    }
    setIsLoading(false);
  }, []);

  const getImageUrl = (imageId: string) => {
    return `${directusUrl}/assets/${imageId}?width=150&format=webp`;
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter(item => item.id !== id);
    saveCart(updated);
  };

  const saveCart = (items: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(items));
    setCartItems(items);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const grandTotal = cartItems.reduce(
    (sum, item) => sum + item.price,
    0
  );

  if (isLoading) {
    return <div class="cart cart--loading">Loading...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div class="cart cart--empty">
        <p class="cart__empty-message">Your cart is empty</p>
        <a href="/artworks/paper" class="button cart__continue">
          Continue Shopping
        </a>
      </div>
    );
  }

  return (
    <div class="cart">
      <div class="cart__items">
        {cartItems.map(item => (
          <div key={item.id} class="cart-item">
            <a href={`/artworks/${item.slug}`} class="cart-item__image-link">
              <img
                src={getImageUrl(item.image)}
                alt={item.title}
                class="cart-item__image"
              />
            </a>
            <div class="cart-item__details">
              <a href={`/artworks/${item.slug}`} class="cart-item__title">
                {item.title}
              </a>
            </div>
            <div class="cart-item__price">
              {formatPrice(item.price)}
            </div>
            <button
              class="cart-item__remove"
              onClick={() => removeItem(item.id)}
              aria-label={`Remove ${item.title} from cart`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div class="cart__summary">
        <div class="cart__total-row">
          <span class="cart__total-label">Total</span>
          <span class="cart__total-value">{formatPrice(grandTotal)}</span>
        </div>
        <p class="cart__shipping-note">
          Taxes included. Shipping calculated at checkout.
        </p>
        <button class="button cart__checkout">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
