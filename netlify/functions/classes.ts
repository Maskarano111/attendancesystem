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
    const user = await verifyToken(event);

    if (event.httpMethod === 'GET') {
      return await handleGetClasses(event, user);
    } else if (event.httpMethod === 'POST') {
      return await handleCreateClass(event, body, user);
    } else if (event.httpMethod === 'PUT') {
      return await handleUpdateClass(event, body, user);
    } else if (event.httpMethod === 'DELETE') {
      return await handleDeleteClass(event, user);
    }
  } catch (error) {
    console.error('Classes error:', error);
    if ((error as any).message === 'No token provided') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Unauthorized' })
      };
    }
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

async function handleGetClasses(event: any, user: any) {
  const { data: classes, error } = await supabase
    .from('classes')
    .select('*');

  if (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Failed to fetch classes' })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'success',
      data: { classes }
    })
  };
}

async function handleCreateClass(event: any, body: any, user: any) {
  if (user.role !== 'lecturer' && user.role !== 'admin') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Only lecturers can create classes' })
    };
  }

  const { name, code, department } = body;
  const classId = uuidv4();

  const { error } = await supabase
    .from('classes')
    .insert({
      id: classId,
      name,
      code,
      lecturer_id: user.id,
      department: department || user.department
    });

  if (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Failed to create class' })
    };
  }

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      status: 'success',
      data: { id: classId, name, code }
    })
  };
}

async function handleUpdateClass(event: any, body: any, user: any) {
  const { class_id, name, code, department } = body;

  // Check if user is lecturer or admin
  if (user.role !== 'lecturer' && user.role !== 'admin') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Forbidden' })
    };
  }

  const { error } = await supabase
    .from('classes')
    .update({ name, code, department })
    .eq('id', class_id)
    .eq('lecturer_id', user.id);

  if (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Failed to update class' })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'success',
      message: 'Class updated'
    })
  };
}

async function handleDeleteClass(event: any, user: any) {
  if (user.role !== 'admin') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Only admins can delete classes' })
    };
  }

  const classId = event.path.split('/').pop();

  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId);

  if (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Failed to delete class' })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'success',
      message: 'Class deleted'
    })
  };
}
