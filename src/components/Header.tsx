import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import LogoutButton from './LogoutButton';

const Header: React.FC = () => {
  const [user, setUser] = useState<any>(null);

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
        
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-green-600 text-white">
            Balance: $10,000.00
          </Badge>
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