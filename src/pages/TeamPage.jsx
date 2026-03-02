/**
 * TeamPage.jsx — Team User Landing Page
 *
 * Route: /team
 * Access: TEAM_USER and above (enforced by ProtectedRoute)
 *
 * Read-only view of assigned roster data.
 * No edit/delete/create actions available.
 */
import React from 'react';
import { Users } from 'lucide-react';

export const TeamPage = () => (
    <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white border-4 border-black shadow-brutal-lg p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 p-2 border-2 border-black shadow-brutal-sm">
                    <Users className="text-white" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-wide">Team Portal</h2>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Read-Only Access
                    </p>
                </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50">
                <p className="font-bold text-sm text-gray-500 uppercase">
                    Team features coming soon
                </p>
                <p className="text-xs text-gray-400 mt-2">
                    View assigned roster · Export team CSV · View duty schedule
                </p>
            </div>
        </div>
    </div>
);
