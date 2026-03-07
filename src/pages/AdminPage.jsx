/**
 * AdminPage.jsx
 *
 * Route: /admin
 * Access: admin or superadmin (enforced by ProtectedRoute in App.jsx)
 *
 * Layout:
 *   1. Public dashboard (read-only view — always visible)
 *   2. Divider with "Admin Controls" label
 *   3. RosterManager (admin editing tools — field teams, directory, exports, etc.)
 *
 * This design ensures the live dashboard is always visible to the admin
 * while editing tools are accessible below it on the same page.
 */
import React from 'react';
import { Settings } from 'lucide-react';
import { DashboardPage } from './DashboardPage';
import { RosterManager } from '../features/roster/RosterManager';

export const AdminPage = () => {
    return (
        <div>
            {/* Public dashboard — same view as / but displayed in admin context */}
            <DashboardPage />

            {/* Visual separator */}
            <div className="border-t-4 border-black bg-gray-900 text-white px-4 py-3 flex items-center gap-3">
                <Settings size={16} />
                <span className="font-black text-xs uppercase tracking-widest">Admin Control Center</span>
            </div>

            {/* Admin tools */}
            <RosterManager />
        </div>
    );
};
