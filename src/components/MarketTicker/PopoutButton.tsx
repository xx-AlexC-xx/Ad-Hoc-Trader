// src/components/PopoutButton.tsx
import React, { useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface PopoutButtonProps {
  children?: React.ReactNode;
  onPopout: (popoutWindow: Window | null) => void;
  title?: string;
  className?: string;
}

export const PopoutButton: React.FC<PopoutButtonProps> = ({
  children = 'Pop Out',
  onPopout,
  title = 'Open in pop-out window',
  className = 'popout-button'
}) => {
  const popoutWindowRef = useRef<Window | null>(null);

  const handlePopout = useCallback(() => {
    // Reuse existing window if still open
    if (popoutWindowRef.current && !popoutWindowRef.current.closed) {
      popoutWindowRef.current.focus();
      return;
    }

    // Open new window (dimensions can be adjusted)
    const width = 800;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const features = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'scrollbars=yes',
      'menubar=no',
      'toolbar=no'
    ].join(',');

    const newWindow = window.open('', '_blank', features);
    if (!newWindow) {
      console.warn('Pop-out blocked by browser');
      return;
    }

    // Minimal initial content to avoid reflow during setup
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin: 0; padding: 16px; background: #071023; color: #e2e8f0; font-family: system-ui; }
            #popout-content { min-height: 100vh; }
          </style>
        </head>
        <body>
          <div id="popout-content"></div>
        </body>
      </html>
    `);
    newWindow.document.close();

    popoutWindowRef.current = newWindow;
    onPopout(newWindow);
  }, [onPopout, title]);

  return (
    <button
      type="button"
      onClick={handlePopout}
      title={title}
      className={className}
      aria-label="Open in pop-out window"
    >
      {children}
    </button>
  );
};

// Optional: Helper hook for rendering into pop-out window
export const usePopoutRenderer = (popoutWindow: Window | null) => {
  const renderInPopout = useCallback((element: React.ReactNode) => {
    if (!popoutWindow || popoutWindow.closed) return null;
    
    const container = popoutWindow.document.getElementById('popout-content');
    if (!container) return null;

    return createPortal(element, container);
  }, [popoutWindow]);

  return renderInPopout;
};