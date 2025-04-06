import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppSupport() {
  const whatsappNumber = '+918591897384';
  const message = encodeURIComponent('Hi, I need support with my order.');
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors z-50 flex items-center gap-2"
      title="Contact Support on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="hidden sm:inline">Need Help?</span>
    </a>
  );
}