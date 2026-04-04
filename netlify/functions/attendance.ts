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

    if (event.path.includes('/mark')) {
      return await handleMarkAttendance(event, body);
    } else if (event.path.includes('/session')) {
      if (event.httpMethod === 'POST') {
        return await handleCreateSession(event, body);
      } else if (event.httpMethod === 'GET') {
        return await handleGetSessions(event);
      } else if (event.httpMethod === 'PUT') {
        return await handleUpdateSession(event, body);
      }
    } else if (event.path.includes('/history')) {
      return await handleGetAttendanceHistory(event);
    }
  } catch (error) {
    console.error('Attendance error:', error);
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

async function handleMarkAttendance(event: any, body: any) {
  try {
    const user = await verifyToken(event);
    const { qr_data, student_name, student_index_number, student_email } = body;

    let qrPayload;
    try {
      qrPayload = JSON.parse(qr_data);
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Invalid QR Code format' })
      };
    }

    const { session_id } = qrPayload;

    // Check if session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
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
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', user.id)
      .eq('session_id', session_id);

    if (existing && existing.length > 0) {
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
        marked_at: new Date().toISOString()
      });

    if (insertError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Failed to mark attendance' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        message: 'Attendance marked successfully'
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

async function handleCreateSession(event: any, body: any) {
  try {
    const user = await verifyToken(event);
    if (user.role !== 'lecturer' && user.role !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Only lecturers can create sessions' })
      };
    }

    const { class_id } = body;
    const sessionId = uuidv4();

    const { error } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        class_id,
        lecturer_id: user.id,
        status: 'active',
        started_at: new Date().toISOString()
      });

    if (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Failed to create session' })
      };
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        status: 'success',
        data: { session_id: sessionId }
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

async function handleGetSessions(event: any) {
  try {
    const user = await verifyToken(event);

    let query = supabase
      .from('sessions')
      .select('*');

    if (user.role === 'lecturer') {
      query = query.eq('lecturer_id', user.id);
    }

    const { data: sessions, error } = await query;

    if (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Failed to fetch sessions' })
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

async function handleUpdateSession(event: any, body: any) {
  try {
    const user = await verifyToken(event);
    const { session_id, status } = body;

    const { error } = await supabase
      .from('sessions')
      .update({ status })
      .eq('id', session_id)
      .eq('lecturer_id', user.id);

    if (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Failed to update session' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        message: 'Session updated'
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

async function handleGetAttendanceHistory(event: any) {
  try {
    const user = await verifyToken(event);

    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', user.id);

    if (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Failed to fetch attendance' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        data: { attendance }
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
