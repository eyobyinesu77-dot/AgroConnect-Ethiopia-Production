import React from 'react';
import { Sprout, Target, Users2, Handshake } from 'lucide-react';

const pillars = [
  {
    icon: Target,
    title: 'Our Mission',
    text: 'Empowering farmers to bring their products directly to market, without middlemen.',
  },
  {
    icon: Users2,
    title: 'Community',
    text: 'Connecting farmers, buyers, and extension workers on one platform.',
  },
  {
    icon: Handshake,
    title: 'Trust',
    text: 'Delivering verified quality through transparent trade and extension worker support.',
  },
];

export default function About() {
  return (
    <div className="bg-green-50 min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-green-100 rounded-full px-4 py-1.5 text-sm text-green-700 font-medium mb-6">
          <Sprout className="h-4 w-4" />
          About Us
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6">About Us</h1>
        <p className="text-gray-600 leading-relaxed text-lg mb-12">
          <b className="text-green-800">AgroConnect Ethiopia</b> is a modern digital platform that enables
          Ethiopian farmers to bring their products directly to buyers without middlemen, access agricultural
          inputs, and receive professional support from extension workers.
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {pillars.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
              <div className="h-11 w-11 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
