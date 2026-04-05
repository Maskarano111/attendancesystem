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
  console.log('[attendance-records] Event:', { method: event.httpMethod, path: event.path });

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const user = await verifyToken(event);

    // Get attendance records for the user
    const { data: records, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[attendance-records] Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          status: 'error', 
          message: 'Failed to fetch attendance records',
          data: { records: [] }
        })
      };
    }

    console.log('[attendance-records] Success - returned', records?.length || 0, 'records');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        data: { records: records || [] }
      })
    };
  } catch (error: any) {
    console.error('[attendance-records] Error:', error);
    if (error.message === 'No token provided') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          status: 'error', 
          message: 'Unauthorized',
          data: { records: [] }
        })
      };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        status: 'error', 
        message: error.message || 'Server error',
        data: { records: [] }
      })
    };
  }
};
