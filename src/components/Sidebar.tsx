import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FaWallet,
  FaChartLine,
  FaCalendarDay,
  FaBoxOpen,
  FaRegListAlt,
  FaLock,
  FaUnlock,
} from 'react-icons/fa';
import {
  FaCrosshairs,
  FaMoneyBillTrendUp,
  FaCompassDrafting,
  FaFirstOrderAlt,
  FaListUl,
} from 'react-icons/fa6';
import { RiMoneyDollarBoxLine } from 'react-icons/ri';

interface SidebarProps {
  modulesVisible: Record<string, boolean>;
  toggleModuleVisibility: (key: string) => void;
  lockGrid: boolean;
  toggleLockGrid: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  modulesVisible,
  toggleModuleVisibility,
  lockGrid,
  toggleLockGrid,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [fadeState, setFadeState] = useState<'in' | 'out' | null>(null);
  const hoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log('[Sidebar] Mounted with modulesVisible:', modulesVisible);
    return () => console.log('[Sidebar] Unmounted');
  }, []);

  // ✅ Updated label to reflect new MarketTicker component
  const sidebarItems = [
    { key: 'cash', name: 'Cash Available', icon: <FaWallet size={11} /> },
    { key: 'pnl', name: 'Total P&L', icon: <FaChartLine size={11} /> },
    { key: 'dailyChange', name: 'Daily Change', icon: <FaCalendarDay size={11} /> },
    { key: 'portfolio', name: 'Portfolio Value', icon: <FaBoxOpen size={11} /> },
    { key: 'activeTrades', name: 'Active Trades', icon: <FaRegListAlt size={11} /> },

    // 🆕 Updated Ticker to new MarketTicker
    { key: 'ticker', name: 'Market Ticker', icon: <FaCrosshairs size={11} /> },

    { key: 'highPotentialTrades', name: 'High Potential Trades', icon: <FaMoneyBillTrendUp size={11} /> },
    { key: 'symbolAgent', name: 'Symbol Agent', icon: <FaCompassDrafting size={11} /> },
    { key: 'orders', name: 'Orders', icon: <FaFirstOrderAlt size={11} /> },
    { key: 'symbolsList', name: 'Symbols List', icon: <FaListUl size={11} /> },
    { key: 'buySell', name: 'Buy/Sell Module', icon: <RiMoneyDollarBoxLine size={11} /> },
  ];

  const handleItemClick = (key: string) => {
    console.log(`[Sidebar] Sidebar item clicked: ${key}`);
    toggleModuleVisibility(key);
  };

  const handleMouseEnter = (key: string, ref: HTMLDivElement | null) => {
    if (ref) {
      const rect = ref.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 32,
        left: rect.left + rect.width / 2,
      });
    }
    setHoveredItem(key);
    setFadeState('in');
  };

  const handleMouseLeave = () => {
    setFadeState('out');
    setTimeout(() => {
      setHoveredItem(null);
    }, 150);
  };

  // Tooltip rendering with fade animation
  const renderTooltip = (text: string) => {
    if (!hoveredItem) return null;

    return createPortal(
      <div
        className={`fixed z-[9999] px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap shadow-lg pointer-events-none transition-opacity duration-150 transform -translate-x-1/2 ${
          fadeState === 'in'
            ? 'opacity-100 translate-y-0'
            : fadeState === 'out'
            ? 'opacity-0 -translate-y-1'
            : 'opacity-0'
        }`}
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        {text}
      </div>,
      document.body
    );
  };

  return (
    <div className="h-screen w-24 bg-[#111] text-gray-300 flex flex-col items-center py-4 space-y-3 overflow-visible">
      {/* 🔒 Lock/Unlock Dashboard */}
      <div
        className="relative flex flex-col items-center justify-center mb-4"
        onMouseEnter={(e) => handleMouseEnter('lock', e.currentTarget)}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={toggleLockGrid}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
            lockGrid
              ? 'bg-red-700 hover:bg-red-600 text-red-200'
              : 'bg-blue-700 hover:bg-blue-600 text-blue-200'
          }`}
        >
          {lockGrid ? <FaLock size={11} /> : <FaUnlock size={11} />}
        </button>
        {hoveredItem === 'lock' &&
          renderTooltip(lockGrid ? 'Unlock Dashboard' : 'Lock Dashboard')}
      </div>

      {/* Sidebar Module Buttons */}
      <nav className="flex-1 flex flex-col items-center overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {sidebarItems.map((item) => {
          const isActive = modulesVisible[item.key];
          return (
            <div
              key={item.key}
              ref={hoverRef}
              className="relative flex flex-col items-center justify-center mb-3"
              onMouseEnter={(e) => handleMouseEnter(item.key, e.currentTarget)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => handleItemClick(item.key)}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  isActive
                    ? 'bg-gray-800 ring-2 ring-blue-400'
                    : 'hover:bg-gray-700'
                }`}
              >
                {item.icon}
              </button>
              {hoveredItem === item.key && renderTooltip(item.name)}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
