import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  FileText, Download, X, ExternalLink, MessageCircle, 
  FileSpreadsheet, Archive, CheckSquare, Square, Loader, Truck 
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { toast, ToastContainer } from 'react-toastify';
import { Link } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

interface DownloadProgress {
  id: string;
  orderId: string;
  progress: number;
}

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
  order_id: string;
}

interface Order {
  id: string;
  order_id: string;
  name: string;
  brand_name: string;
  status: string;
  created_at: string;
  payment_info: string;
  tracking_link?: string;
  whatsapp: string;
  phone: string;
  address: string;
  design_urls: string[];
  mockup_urls?: string[];
  mockup_url?: string;
  payment_screenshot_urls?: string[];
  payment_screenshot_url?: string;
}

const getFileExtension = (url: string) => url.split('.').pop() || 'file';

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    printing: 'bg-indigo-100 text-indigo-800',
    packed: 'bg-purple-100 text-purple-800',
    dispatched: 'bg-green-100 text-green-800',
    error_occurred: 'bg-red-100 text-red-800',
    delay_in_printing: 'bg-orange-100 text-orange-800',
    half_payment_verification: 'bg-pink-100 text-pink-800',
    payment_verification: 'bg-teal-100 text-teal-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const AdminDashboardContent = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [trackingLink, setTrackingLink] = useState('');
  const [downloadQueue, setDownloadQueue] = useState<DownloadProgress[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (debouncedSearchTerm) {
        query = query.or(
          `order_id.ilike.%${debouncedSearchTerm}%,name.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%,whatsapp.ilike.%${debouncedSearchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter, debouncedSearchTerm]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Status updated successfully');
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
      fetchOrders();
    }
  };

  const exportToExcel = async (shippingOnly: boolean = false) => {
    try {
      const selectedOrdersData = selectedOrders.length > 0 
        ? orders.filter(order => selectedOrders.includes(order.id))
        : orders;

      if (selectedOrdersData.length === 0) {
        toast.error('No orders selected for export');
        return;
      }

      const orderIds = selectedOrdersData.map(order => order.id);
      const { data: itemsData, error } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (error) throw error;
      if (!itemsData) throw new Error('No order items found');

      const itemsByOrderId = itemsData.reduce((acc: Record<string, OrderItem[]>, item) => {
        acc[item.order_id] = [...(acc[item.order_id] || []), item];
        return acc;
      }, {});

      const workbook = XLSX.utils.book_new();

      if (shippingOnly) {
        const shippingRows = selectedOrdersData.map(order => {
          const items = itemsByOrderId[order.id] || [];
          const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
          
          const addressParts = order.address.split(/(Pincode:\s*)/i);
          const mainAddress = addressParts[0].trim();
          const pincode = addressParts.length > 2 
            ? addressParts[2].trim().replace(/\D/g, '') 
            : 'N/A';

          return {
            'Order ID': order.order_id,
            'Name': order.name,
            'Brand': order.brand_name,
            'Phone': order.phone,
            'Address': mainAddress,
            'Pincode': pincode,
            'Payment Info': order.payment_info,
            'Product': items.map(i => i.product).join(', '),
            'Quantity': totalQuantity
          };
        });

        const worksheet = XLSX.utils.json_to_sheet(shippingRows);
        worksheet['!cols'] = [
          { wch: 15 }, { wch: 20 }, { wch: 20 }, 
          { wch: 15 }, { wch: 40 }, { wch: 10 },
          { wch: 20 }, { wch: 30 }, { wch: 10 }
        ];
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Shipping');
        XLSX.writeFile(workbook, `shipping_${Date.now()}.xlsx`);
      } else {
        const itemizedRows = selectedOrdersData.flatMap(order => {
          const items = itemsByOrderId[order.id] || [];
          return items.length > 0 
            ? items.map(item => ({
                'Order ID': order.order_id,
                'Product': item.product,
                'Size': item.size,
                'Color': item.color,
                'Quantity': item.quantity,
                'Payment Info': order.payment_info
              }))
            : [{
                'Order ID': order.order_id,
                'Product': '',
                'Size': '',
                'Color': '',
                'Quantity': '',
                'Payment Info': order.payment_info
              }];
        });

        const worksheet = XLSX.utils.json_to_sheet(itemizedRows);
        worksheet['!cols'] = [
          { wch: 15 }, { wch: 25 }, { wch: 10 }, 
          { wch: 15 }, { wch: 10 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
        XLSX.writeFile(workbook, `orders_${Date.now()}.xlsx`);
      }
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      toast.error(`Export failed: ${errorMessage}`);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedOrders.length === 0) {
      toast.warn('Please select orders and a status to update');
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: bulkStatus })
        .in('id', selectedOrders);

      if (error) throw error;
      await fetchOrders();
      setSelectedOrders([]);
      setBulkStatus('');
      toast.success('Bulk status update successful');
    } catch (err) {
      console.error('Bulk update error:', err);
      toast.error('Failed to update orders');
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleAllOrders = () => {
    setSelectedOrders(prev => 
      prev.length === orders.length ? [] : orders.map(order => order.id)
    );
  };

  const updateTrackingNumber = async (orderId: string, trackingLink: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_link: trackingLink })
        .eq('id', orderId);

      if (error) throw error;
      await fetchOrders();
      setShowTrackingModal(false);
      setTrackingLink('');
      toast.success('Tracking link updated');
    } catch (err) {
      console.error('Tracking update error:', err);
      toast.error('Failed to update tracking');
    }
  };

  const shareTrackingWhatsApp = (order: Order) => {
    if (!order.tracking_link) {
      toast.warn('No tracking link available');
      return;
    }

    const message = encodeURIComponent(
      `Hello ${order.name},\n\nYour order ${order.order_id} has been dispatched!\nTrack here: ${order.tracking_link}\n\nThank you!`
    );
    window.open(`https://wa.me/${order.whatsapp}?text=${message}`, '_blank');
  };

  const totalPages = Math.ceil(orders.length / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Loader className="animate-spin h-12 w-12 text-white" />
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            {Object.entries({
              pending: 'Pending',
              processing: 'Processing',
              printing: 'Printing',
              packed: 'Packed',
              dispatched: 'Dispatched',
              error_occurred: 'Error Occurred',
              delay_in_printing: 'Printing Delay',
              half_payment_verification: 'Half Payment',
              payment_verification: 'Payment Verification'
            }).map(([value, label]) => (
              <option key={value} value={value} className={getStatusColor(value)}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {selectedOrders.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Update Status...</option>
              {Object.entries({
                pending: 'Pending',
                processing: 'Processing',
                printing: 'Printing',
                packed: 'Packed',
                dispatched: 'Dispatched',
                error_occurred: 'Error Occurred',
                delay_in_printing: 'Printing Delay',
                half_payment_verification: 'Half Payment',
                payment_verification: 'Payment Verification'
              }).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Apply to Selected
            </button>
            <button 
              onClick={() => exportToExcel(false)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              Export Selected
            </button>
            <button 
              onClick={() => exportToExcel(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Archive className="mr-2 h-5 w-5" />
              Export Shipping
            </button>
            <Link
              to="/admin/bulk-tracking"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center"
            >
              <Truck className="mr-2 h-5 w-5" />
              Bulk Tracking Update
            </Link>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onChange={toggleAllOrders}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{order.order_id}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{order.name}</td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`text-sm rounded-full px-3 py-1 ${getStatusColor(order.status)}`}
                      >
                        {Object.entries({
                          pending: 'Pending',
                          processing: 'Processing',
                          printing: 'Printing',
                          packed: 'Packed',
                          dispatched: 'Dispatched',
                          error_occurred: 'Error Occurred',
                          delay_in_printing: 'Printing Delay',
                          half_payment_verification: 'Half Payment',
                          payment_verification: 'Payment Verification'
                        }).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {format(new Date(order.created_at), 'dd MMM yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          Details
                        </button>
                        {order.tracking_link && (
                          <button
                            onClick={() => shareTrackingWhatsApp(order)}
                            className="text-green-600 hover:text-green-800 flex items-center"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Notify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          setDownloadQueue={setDownloadQueue}
        />
      )}

      <TrackingModal
        showTrackingModal={showTrackingModal}
        selectedOrderForTracking={selectedOrderForTracking}
        trackingLink={trackingLink}
        setTrackingLink={setTrackingLink}
        updateTrackingNumber={updateTrackingNumber}
        setShowTrackingModal={setShowTrackingModal}
      />

      <DownloadProgressBars downloadQueue={downloadQueue} />
      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
};

const OrderDetails = ({ order, onClose, setDownloadQueue }: { 
  order: Order; 
  onClose: () => void;
  setDownloadQueue: React.Dispatch<React.SetStateAction<DownloadProgress[]>>;
}) => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (error) {
        toast.error('Failed to load order items');
        return;
      }
      setOrderItems(data || []);
    };
    fetchItems();
  }, [order.id]);

  const downloadSingleFile = async (url: string, type: string, index: number) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${order.order_id}_${type}_${index+1}.${getFileExtension(url)}`;
      link.click();
    } catch (error) {
      toast.error('File download failed');
    }
  };

  const downloadAllFiles = async () => {
    const downloadId = Date.now().toString();
    try {
      setDownloadQueue(prev => [...prev, { id: downloadId, orderId: order.order_id, progress: 0 }]);
      
      const zip = new JSZip();
      const files = [
        ...order.design_urls.map((url, i) => ({ url, name: `design_${i+1}` })),
        ...(order.mockup_urls || [order.mockup_url])
          .filter(Boolean)
          .map((url, i) => ({ url, name: `mockup_${i+1}` }))
      ];

      for (const [index, file] of files.entries()) {
        const response = await fetch(file.url);
        const blob = await response.blob();
        zip.file(`${file.name}.${getFileExtension(file.url)}`, blob);
        setDownloadQueue(prev => prev.map(dl => 
          dl.id === downloadId ? { ...dl, progress: (index + 1) / files.length * 100 } : dl
        ));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${order.order_id}_files.zip`;
      link.click();
    } catch (error) {
      toast.error('Download failed');
    } finally {
      setDownloadQueue(prev => prev.filter(dl => dl.id !== downloadId));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">Order Details - {order.order_id}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <h3 className="font-semibold">Customer Information</h3>
              <p><span className="font-medium">Name:</span> {order.name}</p>
              <p><span className="font-medium">Brand:</span> {order.brand_name}</p>
              <p><span className="font-medium">Phone:</span> {order.phone}</p>
              <p><span className="font-medium">Address:</span> {order.address}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Order Information</h3>
              <p><span className="font-medium">Status:</span> {order.status}</p>
              <p><span className="font-medium">Created:</span> {format(new Date(order.created_at), 'PPpp')}</p>
              <p><span className="font-medium">Payment Info:</span> {order.payment_info}</p>
              {order.tracking_link && (
                <p><span className="font-medium">Tracking:</span> {order.tracking_link}</p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold mb-4">Products</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderItems.map((item, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">{item.product}</td>
                      <td className="px-6 py-4">{item.size}</td>
                      <td className="px-6 py-4">{item.color}</td>
                      <td className="px-6 py-4">{item.quantity}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {item.front_print_size && <p>Front: {item.front_print_size}</p>}
                          {item.back_print_size && <p>Back: {item.back_print_size}</p>}
                          {item.neck_label && <p>Neck: {item.neck_label}</p>}
                          {item.sleeves && <p>Sleeves: {item.sleeves}</p>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <FileSection 
              title="Design Files" 
              files={order.design_urls} 
              type="design" 
              onDownload={downloadSingleFile}
            />
            <FileSection
              title="Mockup Files"
              files={order.mockup_urls || (order.mockup_url ? [order.mockup_url] : [])}
              type="mockup"
              onDownload={downloadSingleFile}
            />
            <FileSection
              title="Payment Screenshots"
              files={order.payment_screenshot_urls || (order.payment_screenshot_url ? [order.payment_screenshot_url] : [])}
              type="payment"
              onDownload={downloadSingleFile}
            />
            
            <button 
              onClick={downloadAllFiles}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center"
            >
              <Download className="mr-2 h-5 w-5" />
              Download All Design Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FileSection = ({ title, files, type, onDownload }: {
  title: string;
  files: string[];
  type: string;
  onDownload: (url: string, type: string, index: number) => void;
}) => (
  <div>
    <h3 className="font-semibold mb-4">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {files.map((url, i) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center flex-grow">
            <FileText className="h-5 w-5 mr-2 text-gray-500" />
            <span className="text-sm text-gray-600">{type} {i + 1}</span>
            <ExternalLink className="h-4 w-4 ml-2 text-gray-400" />
          </a>
          <button
            onClick={() => onDownload(url, type, i)}
            className="ml-4 p-2 text-indigo-600 hover:text-indigo-800 rounded-lg"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const TrackingModal = ({ 
  showTrackingModal,
  selectedOrderForTracking,
  trackingLink,
  setTrackingLink,
  updateTrackingNumber,
  setShowTrackingModal
}: {
  showTrackingModal: boolean;
  selectedOrderForTracking: Order | null;
  trackingLink: string;
  setTrackingLink: (value: string) => void;
  updateTrackingNumber: (orderId: string, trackingLink: string) => void;
  setShowTrackingModal: (value: boolean) => void;
}) => {
  if (!showTrackingModal || !selectedOrderForTracking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Update Tracking Information</h3>
        <p className="text-sm text-gray-600 mb-2">Order ID: {selectedOrderForTracking.order_id}</p>
        <input
          type="text"
          value={trackingLink}
          onChange={(e) => setTrackingLink(e.target.value)}
          placeholder="Enter tracking link"
          className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowTrackingModal(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => updateTrackingNumber(selectedOrderForTracking.id, trackingLink)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Update Tracking
          </button>
        </div>
      </div>
    </div>
  );
};

const DownloadProgressBars = ({ downloadQueue }: { downloadQueue: DownloadProgress[] }) => (
  <div className="fixed bottom-4 left-4 space-y-4 z-50">
    {downloadQueue.map((download) => (
      <div key={download.id} className="p-4 bg-white rounded-lg shadow-lg border border-gray-200 w-64">
        <div className="text-sm text-gray-600 mb-2">
          {download.orderId} - Downloading ({Math.round(download.progress)}%)
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 rounded-full h-2 transition-all duration-300"
            style={{ width: `${download.progress}%` }}
          />
        </div>
      </div>
    ))}
  </div>
);

class ErrorBoundary extends React.Component<{ fallback: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() { return { hasError: true }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error Boundary:', error, info);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

const ErrorScreen = () => (
  <div className="h-screen flex items-center justify-center bg-red-50">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Reload Page
      </button>
    </div>
  </div>
);

const AdminDashboard = () => (
  <ErrorBoundary fallback={<ErrorScreen />}>
    <AdminDashboardContent />
  </ErrorBoundary>
);

export default AdminDashboard;

export default AdminDashboard

export default AdminDashboard