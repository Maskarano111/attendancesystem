import { Handler } from '@netlify/functions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from './lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-prod';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-prod';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export const handler: Handler = async (event) => {
  console.log('[auth-login] Function called');
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Method not allowed' })
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { email, password } = body;

    console.log('[auth-login] Login attempt for:', email);
    console.log('[auth-login] Supabase configured:', !!process.env.SUPABASE_URL);

    if (!email || !password) {
      console.log('[auth-login] Missing credentials');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Email and password required' })
      };
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    console.log('[auth-login] Query result error:', error?.message || 'none');
    console.log('[auth-login] User found:', !!user);

    if (error || !user) {
      console.log('[auth-login] Invalid credentials');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Invalid credentials' })
      };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.log('[auth-login] Password mismatch');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Invalid credentials' })
      };
    }

    console.log('[auth-login] Login successful');
    const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        token: accessToken,
        refreshToken,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            department: user.department
          }
        }
      })
    };
  } catch (error) {
    console.error('[auth-login] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        message: 'Server error',
        error: error instanceof Error ? error.message : String(error)
      })
    };
  }
};
