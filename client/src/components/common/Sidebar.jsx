import React from 'react';
import { X } from 'lucide-react';
import AdminSidebar from '../sidebars/AdminSidebar';
import FarmerSidebar from '../sidebars/FarmerSidebar';
import BuyerSidebar from '../sidebars/BuyerSidebar';
import ExtensionSidebar from '../sidebars/ExtensionSidebar';

const SIDEBAR_BY_ROLE = {
  admin: AdminSidebar,
  farmer: FarmerSidebar,
  buyer: BuyerSidebar,
  extension: ExtensionSidebar,
};

export default function Sidebar({ role, onLogout, isOpen, onClose }) {
  const RoleSidebar = SIDEBAR_BY_ROLE[role];

  return (
    <>
      {/* Backdrop — mobile/tablet only. Always mounted (not conditionally
          rendered) so the opacity change can actually transition instead of
          snapping in/out; pointer-events-none while hidden so it never
          blocks clicks on the page underneath. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`
          fixed inset-0 z-40 bg-black/50 lg:hidden
          transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-[#f9fafb] text-[#166534] border-r border-green-200
          flex flex-col overflow-y-auto transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:z-auto lg:h-screen lg:sticky lg:top-0
        `}
      >
        {/* Close button — mobile/tablet only; desktop sidebar has no need to close */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-green-100">
          <span className="font-bold text-lg text-[#166534]">🌱 Menu</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-md hover:bg-green-100 transition-colors text-[#166534]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Clicking any nav link (from any role-sidebar) bubbles up here and
            closes the mobile drawer — no need to touch each role sidebar file. */}
        <nav onClick={onClose} className="flex-1 flex flex-col gap-1 p-4 lg:pt-4">
          {RoleSidebar ? <RoleSidebar /> : null}
        </nav>

        <div className="p-4 border-t border-green-200">
          <button
            onClick={onLogout}
            className="w-full bg-red-600 hover:bg-red-700 transition-colors text-white font-semibold py-2 rounded-lg"
          >
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
