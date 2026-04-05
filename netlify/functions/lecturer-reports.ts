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
  console.log('[lecturer-reports] Event:', { method: event.httpMethod, path: event.path });

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

    // Verify lecturer role
    if (user.role !== 'lecturer' && user.role !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Forbidden - lecturer access required' })
      };
    }

    // Get lecturer's classes
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('id, name, code')
      .eq('lecturer_id', user.id);

    if (classError) {
      console.error('[lecturer-reports] Error fetching classes:', classError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Failed to fetch classes' })
      };
    }

    // Get all sessions for lecturer's classes
    const classIds = classes?.map((c: any) => c.id) || [];
    
    if (classIds.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          data: {
            total_classes: 0,
            total_sessions: 0,
            total_attendance_records: 0,
            attendanceStats: [],
            sessions: [],
            classDetails: []
          }
        })
      };
    }

    // Get attendance records for all lecturer's classes
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        id,
        student_id,
        student_name,
        student_email,
        status,
        timestamp,
        sessions(
          id,
          class_id,
          date,
          start_time,
          end_time,
          classes(id, name, code)
        )
      `)
      .in('sessions.class_id', classIds)
      .order('timestamp', { ascending: false });

    if (attendanceError) {
      console.error('[lecturer-reports] Error fetching attendance:', attendanceError);
    }

    // Get sessions for lecturer's classes
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        class_id,
        date,
        start_time,
        end_time,
        status,
        classes(id, name, code)
      `)
      .in('class_id', classIds)
      .order('date', { ascending: false });

    if (sessionError) {
      console.error('[lecturer-reports] Error fetching sessions:', sessionError);
    }

    // Build statistics
    const attendanceStats = groupByClass(attendanceRecords || []);
    const classDetails = buildClassDetails(classes || [], sessions || [], attendanceRecords || []);

    const report = {
      total_classes: classes?.length || 0,
      total_sessions: sessions?.length || 0,
      total_attendance_records: attendanceRecords?.length || 0,
      attendanceStats,
      sessions: sessions || [],
      classDetails
    };

    console.log('[lecturer-reports] Success - generated report for', classes?.length || 0, 'classes');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        data: report
      })
    };
  } catch (error: any) {
    console.error('[lecturer-reports] Error:', error);
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
    const className = r.sessions?.classes?.name || 'Unknown Class';
    map.set(className, (map.get(className) || 0) + 1);
  });
  return Array.from(map.entries()).map(([class_name, attendance_count]) => ({
    class_name,
    attendance_count
  }));
}

function buildClassDetails(classes: any[], sessions: any[], attendance: any[]) {
  return classes.map(cls => {
    const classAttendance = attendance.filter((a: any) => a.sessions?.class_id === cls.id);
    const classSessions = sessions.filter((s: any) => s.class_id === cls.id);
    
    return {
      id: cls.id,
      name: cls.name,
      code: cls.code,
      session_count: classSessions.length,
      attendance_records: classAttendance.length
    };
  });
}
