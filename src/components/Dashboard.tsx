import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@supabase/auth-helpers-react';
import ActiveTrades from './ActiveTrades';
import RecentOrders from './RecentOrders';
import SignalGenerator from './SignalGenerator';
import HighPotentialTrades from './HighPotentialTrades';
import MarketTicker from '@/components/MarketTicker/MarketTicker';
import BuySellModule from './BuySellModule';
import { useAppContext } from '@/contexts/AppContext';
import DashboardDnDWrapper from './DashboardDnDWrapper';
import { RiMoneyDollarBoxLine, RiMoneyEuroBoxLine } from '@remixicon/react';
import Sidebar from './Sidebar';

// react-icons imports
import { FaWallet, FaChartLine, FaCalendarDay, FaBoxOpen, FaRegListAlt, FaListUl } from 'react-icons/fa';
import { FaCompassDrafting } from 'react-icons/fa6';
import SymbolList from './MarketTicker/SymbolsLists';

interface Module {
  key: string;
  name: string;
  icon: JSX.Element;
  component: React.ReactNode;
  isCardStyle?: boolean;
}

const LOCK_STORAGE_KEY = 'dashboard-lock-grid';

// Wrap Dashboard with forwardRef to allow ref from App.tsx
const Dashboard = forwardRef((props, ref) => {
  const { user, totalPnl, dailyChange, cashAvailable, portfolioValue } = useAppContext();
  console.log('[Dashboard] AppContext values:', { user, totalPnl, dailyChange, cashAvailable, portfolioValue });

  const [modulesVisible, setModulesVisible] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem('modulesVisible');
    const initial = stored
      ? JSON.parse(stored)
      : {
          cash: true,
          portfolio: true,
          activeTrades: false,
          pnl: false,
          dailyChange: false,
          symbolsList: false,
          ticker: false,
          highPotentialTrades: false,
          symbolAgent: false,
          orders: false,
          buySell: false,
        };
    console.log('[Dashboard] Initial modulesVisible:', initial);
    return initial;
  });

  const [selectedModule, setSelectedModule] = useState<string>(() => {
    const stored = localStorage.getItem('selectedModule');
    console.log('[Dashboard] Initial selectedModule:', stored || 'orders');
    return stored || 'orders';
  });

  const [showSymbolsListOnly, setshowSymbolsListOnly] = useState(false);
  console.log('[Dashboard] symbolsListModalOpen initial:', showSymbolsListOnly);

  const userId = user?.id ?? '';
  console.log('[Dashboard] User ID:', userId);

  // ✅ Lock toggle for dashboard grid (persisted)
  const [lockGrid, setLockGrid] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(LOCK_STORAGE_KEY);
      return stored ? stored === 'true' : false;
    } catch (err) {
      console.warn('[Dashboard] Unable to read lock state from localStorage', err);
      return false;
    }
  });
  const toggleLockGrid = () => {
    setLockGrid((prev) => !prev);
    console.log('[Dashboard] Lock grid toggled. New state:', !lockGrid);
  };

  useEffect(() => {
    try {
      localStorage.setItem(LOCK_STORAGE_KEY, String(lockGrid));
    } catch (err) {
      console.warn('[Dashboard] Unable to persist lock state', err);
    }
  }, [lockGrid]);

  // Save visibility to localStorage
  useEffect(() => {
    console.log('[Dashboard] Saving modulesVisible to localStorage:', modulesVisible);
    localStorage.setItem('modulesVisible', JSON.stringify(modulesVisible));
  }, [modulesVisible]);

  // Save selected module to localStorage
  useEffect(() => {
    console.log('[Dashboard] Saving selectedModule to localStorage:', selectedModule);
    localStorage.setItem('selectedModule', selectedModule);
  }, [selectedModule]);

  const toggleModuleVisibility = (key: string) => {
    console.log('[Dashboard] toggleModuleVisibility called for key:', key);
    setModulesVisible((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      console.log(`[Dashboard] Module visibility updated: ${key} =>`, updated[key]);
      return updated;
    });
  };

  const toggleSymbolsList = () => {
    console.log('[Dashboard] toggleSymbolsList called');
    setModulesVisible((prev) => {
      const updated = { ...prev, symbolsList: !prev.symbolsList };
      console.log('[Dashboard] symbolsList visibility updated:', updated.symbolsList);
      return updated;
    });
  };

  // Apply font size/style and reduced spacing for these four cards
  const cardFontClass = 'text-sm';
  const cardCompactClass = 'p-1'; // minimized padding for reduced dead space

  const modules: Module[] = [
    {
      key: 'cash',
      name: 'Cash Available',
      icon: <FaWallet />,
      component: (
        <div className={`${cardFontClass} ${cardCompactClass}`}>
          ${cashAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
      isCardStyle: true,
    },
    {
      key: 'pnl',
      name: 'Total P&L',
      icon: <FaChartLine />,
      component: (
        <div className={`${cardFontClass} ${cardCompactClass} ${totalPnl >= 0 ? 'text-teal-500' : 'text-fuchsia-500'}`}>
          {totalPnl.toFixed(2)}
        </div>
      ),
      isCardStyle: true,
    },
    {
      key: 'dailyChange',
      name: 'Daily Change',
      icon: <FaCalendarDay />,
      component: (
        <div className={`${cardFontClass} ${cardCompactClass} ${dailyChange >= 0 ? 'text-teal-500' : 'text-fuchsia-500'}`}>
          {dailyChange.toFixed(6)}
        </div>
      ),
      isCardStyle: true,
    },
    {
      key: 'portfolio',
      name: 'Portfolio Value',
      icon: <FaBoxOpen />,
      component: (
        <div className={`${cardFontClass} ${cardCompactClass}`}>
          ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
      isCardStyle: true,
    },
    {
      key: 'activeTrades',
      name: 'Active Trades',
      icon: <FaRegListAlt />,
      component: <ActiveTrades />,
      isCardStyle: true,
    },
    {
      key: 'ticker',
      name: 'Ticker',
      icon: <FaChartLine />,
      component: <MarketTicker />,
    },
    {
      key: 'highPotentialTrades',
      name: 'High Potential Trades',
      icon: <FaChartLine />,
      component: <HighPotentialTrades
        onSymbolsUpdate={() => console.log('[HighPotentialTrades] onSymbolsUpdate called')}
        onTradesSelected={() => console.log('[HighPotentialTrades] onTradesSelected called')}
      />,
    },
    {
      key: 'symbolAgent',
      name: 'Symbol Agent',
      icon: <FaCompassDrafting />,
      component: <SignalGenerator />,
    },
    {
      key: 'orders',
      name: 'Orders',
      icon: <FaListUl />,
      component: <RecentOrders userId={userId} />,
    },
    {
      key: 'symbolsList',
      name: 'Symbols List',
      icon: <FaListUl />,
      component: (
        <div className="w-full">
          <MarketTicker showSymbolsListOnly={true} />
        </div>
      ),
    },
    {
      key: 'buySell',
      name: 'Buy/Sell Module',
      icon: <RiMoneyDollarBoxLine />,
      component: (
        <div className="w-[350px]">
          <BuySellModule
            fetchSymbols={async () => {
              console.log('[BuySellModule] fetchSymbols called');
              return [];
            }}
            setLastOrderResponse={(resp: any) => console.log('[BuySellModule] setLastOrderResponse called:', resp)}
          />
        </div>
      ),
    },
  ];

  console.log('[Dashboard] Modules defined:', modules.map((m) => ({ key: m.key, name: m.name })));

  // Filter modules according to modulesVisible
  const visibleModules = modules.filter((mod) => modulesVisible[mod.key]);

  // Expose functions to parent via ref
  useImperativeHandle(ref, () => ({
    fetchAllData: () => {
      console.log('[Dashboard] fetchAllData called via ref');
      // Place to add any internal fetch logic if needed
    },
  }));

  // Only show 'cash' and 'portfolio' modules on initial render
  const initialCardOrder = ['cash', 'portfolio'];
  useEffect(() => {
    if (!localStorage.getItem('dashboardCardOrder')) {
      localStorage.setItem('dashboardCardOrder', JSON.stringify(initialCardOrder));
    }
  }, []);

  return (
    <div className="min-h-screen bg-black p-6 flex">
      {/* Sidebar */}
      <Sidebar
        modulesVisible={modulesVisible}
        toggleModuleVisibility={toggleModuleVisibility}
        lockGrid={lockGrid}
        toggleLockGrid={toggleLockGrid}
      />

      {/* Main dashboard content */}
      <div className="flex-1 flex flex-col gap-6 ml-4 max-w-[2000px]">
        <DashboardDnDWrapper
          modules={visibleModules}
          modulesVisible={modulesVisible}
          toggleModuleVisibility={toggleModuleVisibility}
          toggleSymbolsList={toggleSymbolsList}
          isLocked={lockGrid}
          toggleLockGrid={toggleLockGrid}
        />
      </div>

      {showSymbolsListOnly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">Symbols List </h2>
            <button
              className="text-red-500 underline"
              onClick={() => {
                console.log('[Dashboard] Closing SymbolsList modal');
                setshowSymbolsListOnly(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default Dashboard;
