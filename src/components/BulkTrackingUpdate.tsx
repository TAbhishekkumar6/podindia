import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface TrackingEntry {
  orderId: string;
  trackingLink: string;
}

export default function BulkTrackingUpdate() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<TrackingEntry[]>([{ orderId: '', trackingLink: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addEntry = () => {
    setEntries([...entries, { orderId: '', trackingLink: '' }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof TrackingEntry, value: string) => {
    setEntries(entries.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate entries
    const invalidEntries = entries.filter(entry => !entry.orderId || !entry.trackingLink);
    if (invalidEntries.length > 0) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const entry of entries) {
        // First, get the order ID by order_id field
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id')
          .eq('order_id', entry.orderId)
          .single();

        if (orderError || !orderData) {
          console.error(`Order not found: ${entry.orderId}`);
          errorCount++;
          continue;
        }

        // Update the order with tracking information
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            tracking_link: entry.trackingLink,
            status: 'dispatched',
            dispatched_at: new Date().toISOString()
          })
          .eq('id', orderData.id);

        if (updateError) {
          console.error(`Failed to update order ${entry.orderId}:`, updateError);
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} orders`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} orders`);
      }

      if (successCount > 0 && errorCount === 0) {
        // Clear form on complete success
        setEntries([{ orderId: '', trackingLink: '' }]);
      }
    } catch (error) {
      console.error('Error updating tracking numbers:', error);
      toast.error('An error occurred while updating tracking numbers');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Tracking Update</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {entries.map((entry, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order ID
                </label>
                <input
                  type="text"
                  value={entry.orderId}
                  onChange={(e) => updateEntry(index, 'orderId', e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter order ID"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Link
                </label>
                <input
                  type="text"
                  value={entry.trackingLink}
                  onChange={(e) => updateEntry(index, 'trackingLink', e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter tracking link"
                />
              </div>
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="mt-7 px-3 py-2 text-red-600 hover:text-red-800 rounded-md"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={addEntry}
              className="px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + Add Another Entry
            </button>
          </div>

          <div className="pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Updating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Update Tracking Numbers
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}