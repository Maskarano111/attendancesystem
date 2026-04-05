import { Handler } from '@netlify/functions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
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
  console.log('[qr-generate] Event:', { method: event.httpMethod, path: event.path });

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

    // Only lecturers and admins can generate QR codes
    if (user.role !== 'lecturer' && user.role !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Only lecturers can generate QR codes' })
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { class_id, date, start_time, end_time } = body;

    console.log('[qr-generate] Generating QR for class:', class_id);

    if (!class_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Class ID is required' })
      };
    }

    // Verify class exists - if lecturer, verify it's their class
    let classQuery = supabase.from('classes').select('*').eq('id', class_id);
    
    if (user.role === 'lecturer') {
      classQuery = classQuery.eq('lecturer_id', user.id);
    }

    const { data: classData, error: classError } = await classQuery.single();

    if (classError || !classData) {
      console.error('[qr-generate] Class not found or unauthorized:', classError);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Class not found or you do not have permission' })
      };
    }

    const sessionId = uuidv4();
    const qrData = {
      session_id: sessionId,
      class_id: class_id,
      created_at: new Date().toISOString(),
      created_by: user.id
    };
    const qrCodeString = JSON.stringify(qrData);

    console.log('[qr-generate] Creating session with QR');
    const { error: insertError } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        class_id: class_id,
        lecturer_id: user.id,
        date: date || new Date().toISOString().split('T')[0],
        start_time: start_time || '09:00',
        end_time: end_time || '11:00',
        qr_code: qrCodeString,
        status: 'active'
      });

    if (insertError) {
      console.error('[qr-generate] Insert error:', insertError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Failed to generate QR code' })
      };
    }

    console.log('[qr-generate] Generating QR code image');
    
    // Generate actual QR code image as PNG data URL
    const qrCodeImage = await QRCode.toDataURL(qrCodeString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('[qr-generate] QR generated successfully');
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        status: 'success',
        message: 'QR Code generated successfully',
        data: {
          session_id: sessionId,
          qr_code_image: qrCodeImage,
          qr_code_data: qrCodeString
        }
      })
    };
  } catch (error: any) {
    console.error('[qr-generate] Error:', error);
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
