import React from 'react';
import { ScrollText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="bg-green-50 min-h-[85vh]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-green-100 rounded-full px-4 py-1.5 text-sm text-green-700 font-medium mb-6">
          <ScrollText className="h-4 w-4" />
          Terms & Conditions
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6">
          📜 Terms & Conditions
        </h1>
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 text-gray-600 leading-relaxed">
          <p>
            Any transactions and trade conducted on the AgroConnect Ethiopia platform must comply with the
            legal framework. Promotion of illegal products is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
