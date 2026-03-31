import React from 'react';

export default function LoginTest() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-indigo-600">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Login Page</h1>
        <p className="text-gray-600">If you see this, the page is rendering!</p>
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-4"
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-2"
        />
        <button className="w-full bg-indigo-600 text-white py-2 rounded-lg mt-4">
          Sign In
        </button>
      </div>
    </div>
  );
}
