import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">StockSwap</h3>
            <p className="text-gray-400">
              Connecting OEM powersports dealers to streamline inventory visibility and coordination.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/login" className="text-gray-400 hover:text-white">Sign In</Link></li>
              <li><Link to="/register" className="text-gray-400 hover:text-white">Request Access</Link></li>
              <li><Link to="/test" className="text-gray-400 hover:text-white">Test Page</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} StockSwap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;