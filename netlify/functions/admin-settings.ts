import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import { supabase } from './lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-prod';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

async function verifyToken(event: any) {
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  return jwt.verify(token, JWT_SECRET) as any;
}

export const handler: Handler = async (event) => {
  console.log('[admin-settings] Event:', { method: event.httpMethod, path: event.path });

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const user = await verifyToken(event);

    // Verify admin role
    if (user.role !== 'admin' && user.role !== 'department_head') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Forbidden - admin access required' })
      };
    }

    if (event.httpMethod === 'GET') {
      // Return default settings for now
      const settings = {
        term_start: '2024-01-15',
        term_end: '2024-05-30',
        qr_expiry_minutes: 10,
        attendance_rules: 'Attendance is required for all classes unless excused by faculty'
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          data: { settings }
        })
      };
    } else if (event.httpMethod === 'POST') {
      // Update settings
      const body = event.body ? JSON.parse(event.body) : {};
      const { term_start, term_end, qr_expiry_minutes, attendance_rules } = body;

      // For now, just return success - in production, save to database
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          message: 'Settings updated successfully',
          data: {
            settings: {
              term_start,
              term_end,
              qr_expiry_minutes,
              attendance_rules
            }
          }
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Method not allowed' })
    };
  } catch (error: any) {
    console.error('[admin-settings] Error:', error);
    if (error.message === 'No token provided') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Unauthorized' })
      };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        status: 'error', 
        message: error.message || 'Server error'
      })
    };
  }
};
