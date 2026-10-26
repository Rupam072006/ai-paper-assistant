import React, { useRef, useEffect } from 'react';
import { X, Settings, Shield, Home } from 'lucide-react';

export default function UserAccountPopover({ isOpen, onClose, user, onLogout, onOpenSettings }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email ? user.email[0].toUpperCase() : 'R');

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-16 left-3 w-68 bg-[#1e1f20] border border-slate-700/60 rounded-3xl p-4 shadow-2xl z-50 text-slate-200 space-y-4"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Account</span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Summary */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 ring-2 ring-blue-500/40 flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0">
          {initials}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-semibold text-white text-sm truncate">{user?.full_name || 'Researcher'}</h4>
          <div className="bg-blue-600/20 text-blue-400 text-[10px] font-medium px-2 py-0.5 rounded-full border border-blue-500/30 w-fit mt-1 flex items-center space-x-1">
            <Shield className="w-3 h-3 text-blue-400" />
            <span>Pro Researcher</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-1 border-t border-slate-800/80 pt-2 text-xs">
        <button
          onClick={() => {
            onClose();
            if (onOpenSettings) onOpenSettings();
          }}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
        >
          <Settings className="w-4 h-4 text-indigo-400" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => {
            onClose();
            if (onLogout) onLogout();
          }}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition"
        >
          <Home className="w-4 h-4 text-slate-400" />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
}
