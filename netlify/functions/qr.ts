import { Handler } from '@netlify/functions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { supabase } from './lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-prod';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    if (event.httpMethod === 'POST') {
      return await handleGenerateQR(event, body);
    } else if (event.httpMethod === 'GET') {
      return await handleGetQRCodes(event);
    }
  } catch (error) {
    console.error('QR error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Server error' })
    };
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ status: 'error', message: 'Not found' })
  };
};

async function handleGenerateQR(event: any, body: any) {
  try {
    const user = await verifyToken(event);
    if (user.role !== 'lecturer' && user.role !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Only lecturers can generate QR codes' })
      };
    }

    const { class_id } = body;

    // Create a new session
    const sessionId = uuidv4();
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        class_id,
        lecturer_id: user.id,
        status: 'active',
        started_at: new Date().toISOString()
      });

    if (sessionError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Failed to create QR session' })
      };
    }

    // Create QR data
    const qrData = {
      session_id: sessionId,
      class_id,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour expiry
    };

    // Generate QR code (on frontend, you can use qrcode.react or similar)
    // This endpoint just returns the data that should be encoded in the QR
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        data: {
          qr_data: JSON.stringify(qrData),
          session_id: sessionId,
          class_id
        }
      })
    };
  } catch (error: any) {
    if (error.message === 'No token provided') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Unauthorized' })
      };
    }
    throw error;
  }
}

async function handleGetQRCodes(event: any) {
  try {
    const user = await verifyToken(event);
    if (user.role !== 'lecturer' && user.role !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Forbidden' })
      };
    }

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('lecturer_id', user.id)
      .eq('status', 'active');

    if (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Failed to fetch QR sessions' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        data: { sessions }
      })
    };
  } catch (error: any) {
    if (error.message === 'No token provided') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Unauthorized' })
      };
    }
    throw error;
  }
}
