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
  console.log('[attendance-mark] Event:', { method: event.httpMethod, path: event.path });

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
    const body = event.body ? JSON.parse(event.body) : {};
    const { qr_data, student_name, student_index_number, student_email } = body;

    console.log('[attendance-mark] Marking attendance for user:', user.id);

    // Validate input
    if (!qr_data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'QR data is required' })
      };
    }

    let qrPayload;
    try {
      qrPayload = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
    } catch (e) {
      console.error('[attendance-mark] Invalid QR format:', e);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Invalid QR Code format' })
      };
    }

    const { session_id, class_id } = qrPayload;

    if (!session_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Invalid session in QR code' })
      };
    }

    // Check if session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('[attendance-mark] Session not found:', { session_id, error: sessionError });
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Invalid session' })
      };
    }

    if (session.status !== 'active') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'This attendance session is closed' })
      };
    }

    // Check if already marked
    const { data: existing, error: existingError } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', user.id)
      .eq('session_id', session_id);

    if (existing && existing.length > 0) {
      console.log('[attendance-mark] Already marked for this session');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Attendance already marked for this session' })
      };
    }

    // Mark attendance
    const { error: insertError } = await supabase
      .from('attendance')
      .insert({
        id: uuidv4(),
        student_id: user.id,
        session_id: session_id,
        timestamp: new Date().toISOString(),
        status: 'present',
        student_name: student_name || user.username,
        student_email: student_email || user.email
      });

    if (insertError) {
      console.error('[attendance-mark] Insert error:', insertError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Failed to mark attendance' })
      };
    }

    console.log('[attendance-mark] Attendance marked successfully for user:', user.id);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        message: 'Attendance marked successfully'
      })
    };
  } catch (error: any) {
    console.error('[attendance-mark] Error:', error);
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
