import { Handler } from '@netlify/functions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { supabase } from './lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-prod';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  console.log('[sessions-create] Event:', { method: event.httpMethod, path: event.path });

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
    const user = await verifyToken(event);

    // Only lecturers and admins can create sessions
    if (user.role !== 'lecturer' && user.role !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Only lecturers can create sessions' })
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { class_id, date, start_time, end_time } = body;

    console.log('[sessions-create] Creating session for class:', class_id);

    if (!class_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Class ID is required' })
      };
    }

    // Verify class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('id', class_id)
      .single();

    if (classError || !classData) {
      console.error('[sessions-create] Class not found:', classError);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Class not found' })
      };
    }

    const sessionId = uuidv4();
    const qrCode = JSON.stringify({
      session_id: sessionId,
      class_id: class_id,
      created_at: new Date().toISOString()
    });

    console.log('[sessions-create] Inserting session');
    const { error: insertError } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        class_id: class_id,
        lecturer_id: user.id,
        date: date || new Date().toISOString().split('T')[0],
        start_time: start_time || new Date().toTimeString().split(' ')[0],
        end_time: end_time || null,
        qr_code: qrCode,
        status: 'active'
      });

    if (insertError) {
      console.error('[sessions-create] Insert error:', insertError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Failed to create session' })
      };
    }

    console.log('[sessions-create] Session created successfully');
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        status: 'success',
        message: 'QR Code generated successfully',
        data: {
          session_id: sessionId,
          qr_code: qrCode,
          qr_display: `Session: ${sessionId}` // For display purposes
        }
      })
    };
  } catch (error: any) {
    console.error('[sessions-create] Error:', error);
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
