import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please click the "Connect to Supabase" button in the top right to set up your Supabase project.'
  );
}

// Create Supabase client with retries and timeouts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-my-custom-header': 'order-submission-system' },
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper function to delay between uploads
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to chunk array into smaller arrays
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const uploadFile = async (file: File, bucket: string, orderId?: string) => {
  try {
    // Validate file size (max 30MB)
    if (file.size > 30 * 1024 * 1024) {
      throw new Error('File size must be less than 30MB');
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    // If orderId is provided, use it in the filename
    const fileName = orderId 
      ? `${orderId}-${bucket}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      : `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    
    let retries = 3;
    let lastError: any;

    while (retries > 0) {
      try {
        const { error: uploadError, data } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            contentType: file.type,
            upsert: true
          });

        if (uploadError) throw uploadError;
        if (!data) throw new Error('Upload failed - no data returned');

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        return publicUrl;
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          await delay(1000); // Wait 1 second before retrying
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// New function to handle multiple file uploads with batching
export const uploadFiles = async (files: File[], bucket: string, orderId: string): Promise<string[]> => {
  const BATCH_SIZE = 3; // Upload 3 files at a time
  const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches
  const urls: string[] = [];
  const errors: Error[] = [];

  // Split files into batches
  const batches = chunkArray(files, BATCH_SIZE);

  for (const batch of batches) {
    try {
      // Upload batch of files concurrently
      const batchResults = await Promise.allSettled(
        batch.map(file => uploadFile(file, bucket, orderId))
      );

      // Process results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          urls.push(result.value);
        } else {
          errors.push(new Error(`Failed to upload ${batch[index].name}: ${result.reason}`));
        }
      });

      // Wait before processing next batch
      if (batches.indexOf(batch) < batches.length - 1) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    } catch (error) {
      console.error('Batch upload error:', error);
      errors.push(error as Error);
    }
  }

  // If there were any errors, but some files uploaded successfully
  if (errors.length > 0) {
    console.error(`${errors.length} files failed to upload:`, errors);
    if (urls.length === 0) {
      // If no files uploaded successfully, throw the first error
      throw errors[0];
    }
  }

  return urls;
};

export const downloadFile = async (url: string, orderId: string, fileType: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to download file');
    
    const blob = await response.blob();
    const fileExt = url.split('.').pop()?.toLowerCase() || '';
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${orderId}-${fileType}.${fileExt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export const generateOrderId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};