import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: '1. How do I register as a farmer?',
    a: 'Click "Register", select Farmer, and fill in your address (Region, Zone, Wereda) to sign up.',
  },
  {
    q: '2. How is product quality verified?',
    a: 'Extension workers in your area review your products to verify quality.',
  },
  {
    q: '3. How is payment handled?',
    a: 'Transactions are tracked and recorded securely on the platform; both buyer and seller can view the order.',
  },
  {
    q: '4. How do I get extension worker support?',
    a: 'Once registered as a farmer, you will be connected with extension workers in your area.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left px-5 py-4 font-semibold text-green-800"
      >
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="bg-green-50 min-h-[85vh]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">❓ FAQ</h1>
        <p className="text-gray-600 mb-8">Frequently Asked Questions</p>
        <div className="flex flex-col gap-3">
          {faqs.map((item) => (
            <FaqItem key={item.q} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
