import { Handler } from '@netlify/functions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-prod';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-prod';

export const handler: Handler = async (event) => {
  const method = event.httpMethod;
  const path = event.path || '';
  
  console.log(`[Auth Function] Method: ${method}, Path: ${path}, Body: ${event.body}`);
  
  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    console.error('[Auth Function] JSON parse error:', e);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', message: 'Invalid JSON' })
    };
  }

  // Enable CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (path.includes('/login')) {
      console.log('[Auth Function] Handling login');
      return await handleLogin(body, headers);
    } else if (path.includes('/register')) {
      console.log('[Auth Function] Handling register');
      return await handleRegister(body, headers);
    } else if (path.includes('/refresh')) {
      console.log('[Auth Function] Handling refresh');
      return await handleRefresh(body, headers);
    }
  } catch (error) {
    console.error('[Auth Function] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Server error', error: String(error) })
    };
  }

  console.log('[Auth Function] Path not matched, returning 404');
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ status: 'error', message: 'Not found' })
  };
};

async function handleLogin(body: any, headers: any) {
  const { email, password } = body;
  console.log('[handleLogin] Email:', email);

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  console.log('[handleLogin] Supabase error:', error);
  console.log('[handleLogin] User found:', !!user);

  if (error || !user) {
    console.log('[handleLogin] User not found or error');
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Invalid credentials' })
    };
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Invalid credentials' })
    };
  }

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
}

async function handleRegister(body: any, headers: any) {
  const { username, email, password, role = 'student', department } = body;

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .or(`username.eq.${username},email.eq.${email}`)
    .limit(1);

  if (existingUser && existingUser.length > 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Email or username already exists' })
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = uuidv4();

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
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Registration failed' })
    };
  }

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
}

async function handleRefresh(body: any, headers: any) {
  const { refreshToken } = body;

  try {
    const decoded: any = jwt.verify(refreshToken, REFRESH_SECRET);
    const accessToken = jwt.sign({ id: decoded.id }, JWT_SECRET, { expiresIn: '15m' });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        token: accessToken
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Invalid refresh token' })
    };
  }
}
