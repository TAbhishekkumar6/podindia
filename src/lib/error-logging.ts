import { supabase } from './supabase';

export const logError = async (error: Error, formData?: any) => {
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipResponse.json();

    // Ensure error message is not null
    const errorMessage = error.message || 'Unknown error occurred';

    await supabase.from('error_logs').insert({
      ip_address: ip,
      error_message: errorMessage,
      error_stack: error.stack || '',
      user_agent: navigator.userAgent,
      form_data: formData ? JSON.stringify(formData) : null
    });
  } catch (loggingError) {
    console.error('Failed to log error:', loggingError);
  }
};