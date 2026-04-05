import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import { supabase } from './lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-prod';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
  console.log('[admin-audit] Event:', { method: event.httpMethod, path: event.path });

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Method not allowed' })
    };
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

    // Get audit logs
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[admin-audit] Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          status: 'error', 
          message: 'Failed to fetch audit logs',
          data: { logs: [] }
        })
      };
    }

    console.log('[admin-audit] Success - returned', logs?.length || 0, 'logs');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        data: { logs: logs || [] }
      })
    };
  } catch (error: any) {
    console.error('[admin-audit] Error:', error);
    if (error.message === 'No token provided') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          status: 'error', 
          message: 'Unauthorized',
          data: { logs: [] }
        })
      };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        status: 'error', 
        message: error.message || 'Server error',
        data: { logs: [] }
      })
    };
  }
};
