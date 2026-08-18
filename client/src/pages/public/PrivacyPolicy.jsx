import React from 'react';
import { Lock } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="bg-green-50 min-h-[85vh]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-green-100 rounded-full px-4 py-1.5 text-sm text-green-700 font-medium mb-6">
          <Lock className="h-4 w-4" />
          Privacy Policy
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6">
          🔒 Privacy Policy
        </h1>
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 text-gray-600 leading-relaxed">
          <p>
            Your personal information (such as name, phone number, and address) is protected with great care
            and is never shared with any party outside of marketplace connections and legal services.
          </p>
        </div>
      </div>
    </div>
  );
}
