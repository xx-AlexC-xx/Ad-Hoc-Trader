import React from 'react';
import { Button } from '@/components/ui/button';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-gray-800 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-4">Ad Hoc Trading</h3>
            <p className="text-gray-400 text-sm">
              AI-powered trading platform for retail and professional traders.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Trade Signals</a></li>
              <li><a href="#" className="hover:text-white">Market Data</a></li>
              <li><a href="#" className="hover:text-white">Analytics</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
              <li><a href="#" className="hover:text-white">API Docs</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white">Risk Disclosure</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Ad Hoc Trading L.L.C. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs mt-2 md:mt-0">
            Trading involves risk. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;