// src/components/Header.tsx

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import LogoutButton from './LogoutButton';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button'; // Ensure this import exists

const Header: React.FC = () => {
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
    <header className="bg-black text-white p-4 border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo and Titles */}
        <div className="flex items-center space-x-4">
          <img
            src="https://d64gsuwffb70l.cloudfront.net/683e88b9e6e8029a192a1882_1749807866484_e86fbe99.PNG"
            alt="ADHOC Trading"
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold text-white">ADHOC TRADING</h1>
            <p className="text-sm text-gray-400">AI-Powered Trading Platform</p>
          </div>
        </div>

        {/* Right: User Info, Theme Toggle, Refresh */}
        <div className="flex items-center space-x-4">
          {/* 🔁 Refresh Button */}
          <Button
            variant="ghost"
            onClick={() => window.location.reload()}
            className="text-white hover:bg-gray-800"
          >
            🔄 Refresh
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
    </header>
  );
};

export default Header;
