import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, Search, Truck, Printer, AlertTriangle, Package, Loader2, Clock, XCircle, AlertOctagon, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  product: string;
  size: string;
  color: string;
  quantity: number;
  front_print_size: string;
  back_print_size: string;
  neck_label: string;
  sleeves: string;
}

interface Order {
  order_id: string;
  name: string;
  brand_name: string;
  status: string;
  tracking_link: string | null;
  created_at: string;
  pending_at: string | null;
  processing_at: string | null;
  printing_at: string | null;
  packed_at: string | null;
  error_occurred_at: string | null;
  delay_in_printing_at: string | null;
  dispatched_at: string | null;
  half_payment_verification_at: string | null;
  payment_verification_at: string | null;
  id: string;
}

interface TimelineEvent {
  status: string;
  date: string | null;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface OrderTrackingProps {
  showMyOrders?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-6 w-6" />;
    case 'processing':
      return <Package className="h-6 w-6" />;
    case 'printing':
      return <Printer className="h-6 w-6" />;
    case 'packed':
      return <CheckCircle className="h-6 w-6" />;
    case 'error_occurred':
      return <XCircle className="h-6 w-6" />;
    case 'delay_in_printing':
      return <AlertOctagon className="h-6 w-6" />;
    case 'dispatched':
      return <Truck className="h-6 w-6" />;
    case 'half_payment_verification':
    case 'payment_verification':
      return <CreditCard className="h-6 w-6" />;
    default:
      return <Clock className="h-6 w-6" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    case 'processing':
      return 'text-blue-500 bg-blue-50 border-blue-200';
    case 'printing':
      return 'text-purple-500 bg-purple-50 border-purple-200';
    case 'packed':
      return 'text-green-500 bg-green-50 border-green-200';
    case 'error_occurred':
      return 'text-red-500 bg-red-50 border-red-200';
    case 'delay_in_printing':
      return 'text-orange-500 bg-orange-50 border-orange-200';
    case 'dispatched':
      return 'text-teal-500 bg-teal-50 border-teal-200';
    case 'half_payment_verification':
    case 'payment_verification':
      return 'text-pink-500 bg-pink-50 border-pink-200';
    default:
      return 'text-gray-500 bg-gray-50 border-gray-200';
  }
};

const getStatusDescription = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Order received and pending processing';
    case 'processing':
      return 'Order is being processed';
    case 'printing':
      return 'Your order is currently being printed';
    case 'packed':
      return 'Order has been packed and ready for dispatch';
    case 'error_occurred':
      return 'There was an issue with your order';
    case 'delay_in_printing':
      return 'Printing has been delayed';
    case 'dispatched':
      return 'Order has been dispatched';
    case 'half_payment_verification':
      return 'Awaiting verification of half payment';
    case 'payment_verification':
      return 'Payment verification in progress';
    default:
      return 'Status unknown';
  }
};

const OrderTimeline = ({ order }: { order: Order }) => {
  const timelineEvents: TimelineEvent[] = [
    {
      status: 'pending',
      date: order.pending_at,
      icon: getStatusIcon('pending'),
      color: getStatusColor('pending'),
      description: getStatusDescription('pending')
    },
    {
      status: 'processing',
      date: order.processing_at,
      icon: getStatusIcon('processing'),
      color: getStatusColor('processing'),
      description: getStatusDescription('processing')
    },
    {
      status: 'printing',
      date: order.printing_at,
      icon: getStatusIcon('printing'),
      color: getStatusColor('printing'),
      description: getStatusDescription('printing')
    },
    {
      status: 'packed',
      date: order.packed_at,
      icon: getStatusIcon('packed'),
      color: getStatusColor('packed'),
      description: getStatusDescription('packed')
    },
    {
      status: 'dispatched',
      date: order.dispatched_at,
      icon: getStatusIcon('dispatched'),
      color: getStatusColor('dispatched'),
      description: getStatusDescription('dispatched')
    }
  ];

  // Add payment verification events if they exist
  if (order.half_payment_verification_at) {
    timelineEvents.push({
      status: 'half_payment_verification',
      date: order.half_payment_verification_at,
      icon: getStatusIcon('half_payment_verification'),
      color: getStatusColor('half_payment_verification'),
      description: getStatusDescription('half_payment_verification')
    });
  }

  if (order.payment_verification_at) {
    timelineEvents.push({
      status: 'payment_verification',
      date: order.payment_verification_at,
      icon: getStatusIcon('payment_verification'),
      color: getStatusColor('payment_verification'),
      description: getStatusDescription('payment_verification')
    });
  }

  // Add error or delay events if they exist
  if (order.error_occurred_at) {
    timelineEvents.push({
      status: 'error_occurred',
      date: order.error_occurred_at,
      icon: getStatusIcon('error_occurred'),
      color: getStatusColor('error_occurred'),
      description: getStatusDescription('error_occurred')
    });
  }

  if (order.delay_in_printing_at) {
    timelineEvents.push({
      status: 'delay_in_printing',
      date: order.delay_in_printing_at,
      icon: getStatusIcon('delay_in_printing'),
      color: getStatusColor('delay_in_printing'),
      description: getStatusDescription('delay_in_printing')
    });
  }

  // Sort events by date
  const sortedEvents = timelineEvents
    .filter(event => event.date)
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
      <div className="relative">
        {sortedEvents.map((event, index) => (
          <div key={event.status} className="flex items-start mb-8 relative">
            {/* Vertical line */}
            {index < sortedEvents.length - 1 && (
              <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-200" />
            )}
            
            {/* Timeline node */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${event.color} border-2`}>
              {event.icon}
            </div>
            
            {/* Event content */}
            <div className="ml-4 flex-grow">
              <div className="flex items-center">
                <h4 className="text-lg font-medium capitalize">
                  {event.status.replace(/_/g, ' ')}
                </h4>
                {event.date && (
                  <span className="ml-2 text-sm text-gray-500">
                    {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">{event.description}</p>
              {event.status === 'dispatched' && order.tracking_link && (
                <a
                  href={order.tracking_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-800"
                >
                  <Truck className="h-4 w-4 mr-1" />
                  Track Shipment
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function OrderTracking({ showMyOrders = false }: OrderTrackingProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchOrderId, setSearchOrderId] = useState(orderId || '');
  const [savedOrders, setSavedOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadSavedOrders = async () => {
      const saved = localStorage.getItem('savedOrders');
      if (saved) {
        const orderIds = JSON.parse(saved) as string[];
        const orders: Order[] = [];
        
        for (const id of orderIds) {
          try {
            const { data, error } = await supabase
              .from('orders')
              .select('*')
              .eq('order_id', id)
              .maybeSingle();
            
            if (!error && data) {
              orders.push(data);
            }
          } catch (err) {
            console.error('Error fetching order:', err);
          }
        }
        
        // Sort orders by date, newest first
        orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setSavedOrders(orders);
      }
    };

    loadSavedOrders();
  }, []);

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (err) {
      console.error('Error fetching order items:', err);
    }
  };

  const fetchOrderDetails = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_id,
          name,
          brand_name,
          status,
          tracking_link,
          created_at,
          pending_at,
          processing_at,
          printing_at,
          packed_at,
          error_occurred_at,
          delay_in_printing_at,
          dispatched_at,
          half_payment_verification_at,
          payment_verification_at
        `)
        .eq('order_id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching order:', error);
        setError('Error fetching order details. Please try again.');
        setOrder(null);
        return;
      }

      if (!data) {
        setError(`Order with ID ${id} not found. Please check the order ID and try again.`);
        setOrder(null);
        return;
      }

      setOrder(data);
      await fetchOrderItems(data.id);

      if (id !== orderId) {
        navigate(`/track/${id}`);
      }

      // Save to localStorage if not already saved
      const savedOrderIds = JSON.parse(localStorage.getItem('savedOrders') || '[]') as string[];
      if (!savedOrderIds.includes(id)) {
        savedOrderIds.push(id);
        localStorage.setItem('savedOrders', JSON.stringify(savedOrderIds));
        setSavedOrders([data, ...savedOrders]);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('An unexpected error occurred. Please try again later.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchOrderId) {
      fetchOrderDetails(searchOrderId);
    }
  };

  const handleRemoveOrder = (orderId: string) => {
    const savedOrderIds = JSON.parse(localStorage.getItem('savedOrders') || '[]') as string[];
    const newOrderIds = savedOrderIds.filter(id => id !== orderId);
    localStorage.setItem('savedOrders', JSON.stringify(newOrderIds));
    setSavedOrders(savedOrders.filter(order => order.order_id !== orderId));
  };

  useEffect(() => {
    if (orderId) {
      setSearchOrderId(orderId);
      fetchOrderDetails(orderId);
    }
  }, [orderId]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            {showMyOrders ? 'My Orders' : 'Track Your Order'}
          </h1>

          {showMyOrders && savedOrders.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Order History</h2>
              <div className="space-y-3 sm:space-y-4">
                {savedOrders.map((savedOrder) => (
                  <div key={savedOrder.order_id} 
                       className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-4 rounded-lg gap-3 sm:gap-0">
                    <div className="flex flex-col">
                      <span className="font-mono text-gray-600 text-sm sm:text-base">{savedOrder.order_id}</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(savedOrder.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(savedOrder.status)}`}>
                        {savedOrder.status.replace(/_/g, ' ')}
                      </span>
                      <button
                        onClick={() => fetchOrderDetails(savedOrder.order_id)}
                        className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Track
                      </button>
                      <button
                        onClick={() => handleRemoveOrder(savedOrder.order_id)}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="text"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                placeholder="Enter your order ID"
                className="flex-1 h-12 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 h-12 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                Track
              </button>
            </div>
          </form>

          {loading && !order && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                <span className="text-gray-600">Loading order details...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2" role="alert">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {order && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Order Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order ID</label>
                    <p className="mt-1 text-lg font-mono text-gray-900">{order.order_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Name</label>
                    <p className="mt-1 text-gray-900">{order.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Brand Name</label>
                    <p className="mt-1 text-gray-900">{order.brand_name}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order Date</label>
                    <p className="mt-1 text-gray-900">
                      {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className={`mt-1 inline-flex px-2 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                </div>
              </div>

              {orderItems.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Products</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Color
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Front Print Size
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Back Print Size
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Neck Label
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sleeves
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orderItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.product}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.size}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.color}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.front_print_size}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.back_print_size}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.neck_label}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.sleeves}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Order Timeline */}
              <OrderTimeline order={order} />

              {order.tracking_link && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <label className="text-sm font-medium text-gray-500">Tracking Link</label>
                  <a
                    href={order.tracking_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Truck className="h-5 w-5" />
                    Track your shipment
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}