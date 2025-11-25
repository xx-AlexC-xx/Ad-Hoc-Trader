// src/components/Header.tsx

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import LogoutButton from './LogoutButton';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  fetchAllData: () => Promise<void>; // new prop for refresh
}

const Header: React.FC<HeaderProps> = ({ fetchAllData }) => {
  const [user, setUser] = useState<any>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <header className="w-full h-28 relative bg-[url('/image1.png')] bg-cover bg-center bg-no-repeat text-white border-b border-gray-800">
      {/* Inner container for padding and content */}
      <div className="max-w-7xl mx-auto flex items-center justify-between h-full px-4 relative z-10">
        {/* Left: Logo */}
        <div className="flex items-center space-x+10 z-0">
          <img
            src="/"
            alt="LoGo Here"
            className="h-flex w-60"
          />
        </div>

        {/* Right: User Info, Theme Toggle, Refresh */}
        <div className="flex items-center space-x-4 z-10">
          {/* 🔁 Smart Refresh Button */}
          <Button
            variant="ghost"
            onClick={fetchAllData}
            className="text-white hover:bg-gray-800"
          >
            {/* button here if needed */}
          </Button>

          {/* 👤 User Info + Logout */}
          {user && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-300">
                Logged in as: {user.email}
              </span>
              <LogoutButton />
            </div>
          )}
        </div>
      </div>

      {/* Center Text: AI Trading Bot */}
      <div className="absolute inset-0 flex items-end justify-center pb-4 z-0 pointer-events-none">
        <span className="text-white text-xl font-bold"></span>
      </div>
    </header>
  );
};

export default Header;
