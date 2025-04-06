import { supabase } from './supabase';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

interface LoginAttempt {
  ip: string;
  timestamp: number;
  count: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

export const validateLoginAttempt = async (ip: string): Promise<boolean> => {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (attempt) {
    // Reset if timeout has passed
    if (now - attempt.timestamp > LOGIN_TIMEOUT) {
      loginAttempts.delete(ip);
      return true;
    }

    // Block if too many attempts
    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
      return false;
    }

    attempt.count++;
    attempt.timestamp = now;
  } else {
    loginAttempts.set(ip, { ip, timestamp: now, count: 1 });
  }

  return true;
};

export const validatePassword = (password: string): boolean => {
  // At least 12 characters, must include uppercase, lowercase, number, and special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{12,}$/;
  return passwordRegex.test(password);
};

export const logAdminAction = async (userId: string, action: string, details: any) => {
  try {
    await supabase.from('admin_logs').insert({
      user_id: userId,
      action,
      details,
      ip_address: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(data => data.ip)
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};