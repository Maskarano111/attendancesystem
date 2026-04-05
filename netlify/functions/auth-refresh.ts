import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-prod';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-prod';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export const handler: Handler = async (event) => {
  console.log('[auth-refresh] Function called');
  
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
    const { refreshToken } = body;

    console.log('[auth-refresh] Refresh token received');

    if (!refreshToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Refresh token required' })
      };
    }

    const decoded: any = jwt.verify(refreshToken, REFRESH_SECRET);
    console.log('[auth-refresh] Token valid for user:', decoded.id);
    
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
    console.error('[auth-refresh] Error:', error);
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Invalid refresh token' })
    };
  }
};
