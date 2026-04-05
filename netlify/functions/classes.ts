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
  console.log('[classes] Event:', { method: event.httpMethod, path: event.path });

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const user = await verifyToken(event);

    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Method not allowed' })
      };
    }

    // Get classes based on user role
    let query = supabase.from('classes').select('*');

    // If lecturer, only show their classes
    if (user.role === 'lecturer') {
      query = query.eq('lecturer_id', user.id);
    }
    // If student, show all classes
    // If admin, show all classes

    const { data: classes, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('[classes] Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          status: 'error', 
          message: 'Failed to fetch classes',
          data: { classes: [] }
        })
      };
    }

    console.log('[classes] Success - returned', classes?.length || 0, 'classes');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        data: { classes: classes || [] }
      })
    };
  } catch (error: any) {
    console.error('[classes] Error:', error);
    if (error.message === 'No token provided') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          status: 'error', 
          message: 'Unauthorized',
          data: { classes: [] }
        })
      };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        status: 'error', 
        message: error.message || 'Server error',
        data: { classes: [] }
      })
    };
  }
};
