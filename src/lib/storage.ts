// Simple storage service using localStorage
interface Submission {
  id: string;
  orderId: string;
  name: string;
  brandName: string;
  address: string;
  phone: string;
  whatsapp: string;
  size: string;
  color: string;
  customColor?: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
  designUrls: string[];
  mockupUrl: string;
  paymentScreenshotUrl: string;
  status: 'pending' | 'processed' | 'payment_confirmed';
  createdAt: string;
}

const STORAGE_KEY = 'submissions';
const PRODUCTS_KEY = 'products';

// Generate a unique order ID
const generateOrderId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

// Initialize demo products
const initProducts = () => {
  const products = [
    { id: '1', name: 'Oversized 240GSM 100% Cotton T-shirt', price: 29.99 },
    { id: '2', name: 'Hoodie 320GSM', price: 49.99 },
    { id: '3', name: 'Hoodie 430GSM', price: 59.99 },
    { id: '4', name: 'Sweatshirt 320GSM', price: 44.99 },
    { id: '5', name: 'Oversized 180GSM T-shirt', price: 24.99 },
    { id: '6', name: 'Regular T-shirt', price: 19.99 },
    { id: '7', name: 'Acid Wash 240GSM T-shirt', price: 34.99 }
  ];
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  return products;
};

export const storage = {
  getProducts: () => {
    const products = localStorage.getItem(PRODUCTS_KEY);
    return products ? JSON.parse(products) : initProducts();
  },

  getSubmissions: () => {
    const submissions = localStorage.getItem(STORAGE_KEY);
    return submissions ? JSON.parse(submissions) : [];
  },

  addSubmission: (submission: Omit<Submission, 'id' | 'orderId' | 'createdAt' | 'status'>) => {
    const submissions = storage.getSubmissions();
    const newSubmission: Submission = {
      ...submission,
      id: Math.random().toString(36).substr(2, 9),
      orderId: generateOrderId(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    submissions.push(newSubmission);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    return newSubmission;
  },

  updateSubmissionStatus: (id: string, status: 'pending' | 'processed' | 'payment_confirmed') => {
    const submissions = storage.getSubmissions();
    const updatedSubmissions = submissions.map(sub => 
      sub.id === id ? { ...sub, status } : sub
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubmissions));
  }
};