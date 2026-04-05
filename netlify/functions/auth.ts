import { Handler } from '@netlify/functions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-prod';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-prod';

export const handler: Handler = async (event) => {
  const method = event.httpMethod;
  
  // Netlify passes the captured path differently - get it from multiple sources
  let path = event.path || '';
  
  // If path is empty, try rawUrl
  if (!path && event.rawUrl) {
    const url = new URL(event.rawUrl);
    path = url.pathname;
  }
  
  // Also check querystring for route info
  const queryParams = event.queryStringParameters || {};
  
  console.log(`[Auth Handler] Method: ${method}, Path: ${path}, RawUrl: ${event.rawUrl}`);
  
  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    console.error('[Auth Handler] JSON parse error:', e);
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
    console.log('[Auth Handler] Handling OPTIONS');
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Check multiple ways the path could come through
    if (path.includes('login') || path === '/login') {
      console.log('[Auth Handler] Routing to handleLogin');
      return await handleLogin(body, headers);
    } else if (path.includes('register') || path === '/register') {
      console.log('[Auth Handler] Routing to handleRegister');
      return await handleRegister(body, headers);
    } else if (path.includes('refresh') || path === '/refresh') {
      console.log('[Auth Handler] Routing to handleRefresh');
      return await handleRefresh(body, headers);
    } else {
      // Default to login if nothing matched (most common case for /api/auth/*)
      console.log('[Auth Handler] No path matched, defaulting to login handler');
      return await handleLogin(body, headers);
    }
  } catch (error) {
    console.error('[Auth Handler] Caught error:', error);
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

async function handleLogin(body: any, headers: any) {
  const { email, password } = body;
  console.log('[handleLogin] Starting login for email:', email);
  console.log('[handleLogin] Supabase URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('[handleLogin] Supabase Key:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

  if (!email || !password) {
    console.log('[handleLogin] Missing email or password');
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Email and password required' })
    };
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    console.log('[handleLogin] Supabase query completed');
    console.log('[handleLogin] Error:', error ? error.message : 'none');
    console.log('[handleLogin] User found:', !!user);

    if (error) {
      console.log('[handleLogin] Query error details:', error);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Invalid credentials' })
      };
    }

    if (!user) {
      console.log('[handleLogin] User not found');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Invalid credentials' })
      };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.log('[handleLogin] Password mismatch');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Invalid credentials' })
      };
    }

    console.log('[handleLogin] Password matched, generating tokens');
    const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    console.log('[handleLogin] Login successful');
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
    console.error('[handleLogin] Caught error:', error);
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
