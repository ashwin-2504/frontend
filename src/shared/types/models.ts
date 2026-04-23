// Frontend models matching backend schema
// Note: Frontend uses JS SDK, so Timestamp is different, using Date or string for simplicity here.

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'customer' | 'seller';
  defaultAddressId: string;
  createdAt: any;
}

export interface Address {
  id: string;
  label: string;
  fullAddress: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Seller {
  sellerId: string;
  uid: string;
  farmName: string;
  description: string;
  pincode: string;
  isActive: boolean;
  avgRating: number;
  totalReviews: number;
}

export interface Product {
  productId: string;
  sellerId: string;
  sellerSnapshot: {
    farmName: string;
    pincode: string;
  };
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  stockQty: number;
  isAvailable: boolean;
  imageUrls: string[];
  avgRating: number;
  updatedAt: any;
}

export interface CartItem {
  productId: string;
  sellerId: string;
  qty: number;
  priceAtAdd: number;
  productSnapshot: {
    name: string;
    unit: string;
    imageUrl: string;
  };
}

export interface Cart {
  uid: string;
  items: CartItem[];
  updatedAt: any;
}

export interface Order {
  orderId: string;
  uid: string;
  addressSnapshot: Address;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  transactionId: string;
  sellerIds: string[];
  createdAt: any;
  updatedAt: any;
}

export interface OrderItem {
  itemId: string;
  orderId: string;
  sellerId: string;
  productId: string;
  productSnapshot: {
    name: string;
    unit: string;
    imageUrl: string;
  };
  qty: number;
  priceAtPurchase: number;
  itemStatus: string;
}

export interface SellerOrder {
  docId: string;
  sellerId: string;
  orderId: string;
  buyerName: string;
  deliveryPincode: string;
  status: string;
  items: OrderItem[];
  sellerTotal: number;
  createdAt: any;
}

export interface StockLock {
  productId: string;
  lockedQty: number;
  orderId: string;
  uid: string;
  expiresAt: any;
}

export interface Review {
  reviewId: string;
  targetId: string;
  targetType: 'product' | 'seller';
  uid: string;
  orderId: string;
  rating: number;
  comment: string;
  reviewerName: string;
  createdAt: any;
}
