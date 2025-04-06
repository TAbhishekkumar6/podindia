import React from 'react';
import { Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} DehaPrintOnDemand. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://www.instagram.com/dehaprintondemandindia/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-600 transition-colors duration-200"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}