import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 text-center px-4">
      <span className="text-6xl mb-4">🌾</span>
      <h1 className="text-4xl font-bold text-green-800 mb-2">404</h1>
      <p className="text-gray-600 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="bg-green-700 hover:bg-green-800 text-white font-semibold px-5 py-2.5 rounded-lg"
      >
        Back to Home
      </Link>
    </div>
  );
}
