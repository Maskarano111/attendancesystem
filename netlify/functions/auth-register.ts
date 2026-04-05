import { Handler } from '@netlify/functions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
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
  console.log('[auth-register] Function called');
  
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
    const { username, email, password, role = 'student', department } = body;

    console.log('[auth-register] Registration attempt for:', email);

    // Validate input
    if (!username || !email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Username, email, and password required' })
      };
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      console.log('[auth-register] User already exists');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Email or username already exists' })
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    console.log('[auth-register] Inserting new user');
    const { error } = await supabase
      .from('users')
      .insert({
        id,
        username,
        email,
        password_hash: hashedPassword,
        role,
        department: department || null
      });

    if (error) {
      console.log('[auth-register] Insertion error:', error);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Registration failed' })
      };
    }

    console.log('[auth-register] Registration successful');
    const accessToken = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id }, REFRESH_SECRET, { expiresIn: '7d' });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        status: 'success',
        token: accessToken,
        refreshToken,
        data: {
          user: { id, username, email, role, department }
        }
      })
    };
  } catch (error) {
    console.error('[auth-register] Error:', error);
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
