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
  console.log('[admin-sessions] Event:', { method: event.httpMethod, path: event.path });

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
      // Get all sessions with related class info
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          id,
          class_id,
          lecturer_id,
          date,
          start_time,
          end_time,
          qr_code,
          status,
          created_at,
          classes:class_id(id, name, code)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[admin-sessions] Database error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            status: 'error', 
            message: 'Failed to fetch sessions',
            data: { sessions: [] }
          })
        };
      }

      console.log('[admin-sessions] Success - returned', sessions?.length || 0, 'sessions');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          data: { sessions: sessions || [] }
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Method not allowed' })
    };
  } catch (error: any) {
    console.error('[admin-sessions] Error:', error);
    if (error.message === 'No token provided') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          status: 'error', 
          message: 'Unauthorized',
          data: { sessions: [] }
        })
      };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        status: 'error', 
        message: error.message || 'Server error',
        data: { sessions: [] }
      })
    };
  }
};
