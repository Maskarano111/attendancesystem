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
  console.log('[admin-reports] Event:', { method: event.httpMethod, path: event.path });

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

    // Get all attendance stats
    const { data: attendanceStats, error: statsError } = await supabase
      .from('attendance')
      .select(`
        id,
        student_id,
        session_id,
        status,
        timestamp,
        class_id,
        classes:class_id(id, name, code)
      `)
      .order('timestamp', { ascending: false });

    if (statsError) {
      console.error('[admin-reports] Error fetching stats:', statsError);
    }

    // Get session count
    const { count: sessionCount, error: sessionError } = await supabase
      .from('sessions')
      .select('id', { count: 'exact' });

    // Get user count
    const { count: userCount, error: userError } = await supabase
      .from('users')
      .select('id', { count: 'exact' });

    const report = {
      total_sessions: sessionCount || 0,
      total_users: userCount || 0,
      attendance_records: attendanceStats?.length || 0,
      attendanceStats: groupByClass(attendanceStats || [])
    };

    console.log('[admin-reports] Success - generated report');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        data: report
      })
    };
  } catch (error: any) {
    console.error('[admin-reports] Error:', error);
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

function groupByClass(records: any[]) {
  const map = new Map<string, number>();
  records.forEach(r => {
    const className = r.classes?.name || 'Unknown Class';
    map.set(className, (map.get(className) || 0) + 1);
  });
  return Array.from(map.entries()).map(([class_name, attendance_count]) => ({
    class_name,
    attendance_count
  }));
}
