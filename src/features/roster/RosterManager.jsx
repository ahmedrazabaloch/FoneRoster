import React, { useState, useEffect } from 'react';
import { Briefcase, Download, Shield } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { FieldTeamConfig } from './FieldTeamConfig';
import { HotlineConfig } from './HotlineConfig';
import { DirectoryManager } from '../directory/DirectoryManager';
import { ExportPanel } from '../exports/ExportPanel';
import { AuditLogViewer } from '../audit/AuditLogViewer';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';

export const RosterManager = () => {
    const perms = useAdminPermissions();

    // Determine the first permitted tab as default
    const getDefaultView = () => {
        if (perms.fieldTeams) return 'field';
        if (perms.hotlineStaff) return 'hotline';
        if (perms.teamDirectory) return 'directory';
        if (perms.exports) return 'exports';
        if (perms.auditLogs) return 'audit';
        return 'none';
    };

    const [activeView, setActiveView] = useState(getDefaultView);

    // Re-sync default when permissions load (async)
    useEffect(() => {
        setActiveView(getDefaultView());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [perms.fieldTeams, perms.hotlineStaff, perms.teamDirectory, perms.exports, perms.auditLogs]);

    return (
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
            <div className="mb-4 md:mb-8 border-b-4 border-black pb-3 md:pb-4">
                <h1 className="text-2xl md:text-4xl font-black uppercase">Roster Control</h1>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-4 mb-4 md:mb-8">
                {perms.fieldTeams && (
                    <Button onClick={() => setActiveView('field')}
                        variant={activeView === 'field' ? 'primary' : 'ghost'}
                        className="text-xs md:text-sm min-h-[44px]">
                        Field Teams
                    </Button>
                )}
                {perms.hotlineStaff && (
                    <Button onClick={() => setActiveView('hotline')}
                        variant={activeView === 'hotline' ? 'primary' : 'ghost'}
                        className="text-xs md:text-sm min-h-[44px]">
                        Hotline Staff
                    </Button>
                )}
                {perms.teamDirectory && (
                    <Button onClick={() => setActiveView('directory')}
                        variant={activeView === 'directory' ? 'secondary' : 'ghost'}
                        className="flex items-center space-x-2 text-xs md:text-sm min-h-[44px]">
                        <Briefcase size={16} />
                        <span className="hidden sm:inline">Team Directory</span>
                        <span className="sm:hidden">Directory</span>
                    </Button>
                )}
                {perms.exports && (
                    <Button onClick={() => setActiveView('exports')}
                        variant={activeView === 'exports' ? 'secondary' : 'ghost'}
                        className="flex items-center space-x-2 text-xs md:text-sm min-h-[44px]">
                        <Download size={16} />
                        <span>Exports</span>
                    </Button>
                )}
                {perms.auditLogs && (
                    <Button onClick={() => setActiveView('audit')}
                        variant={activeView === 'audit' ? 'secondary' : 'ghost'}
                        className="flex items-center space-x-2 text-xs md:text-sm min-h-[44px]">
                        <Shield size={16} />
                        <span className="hidden sm:inline">Audit Logs</span>
                        <span className="sm:hidden">Audit</span>
                    </Button>
                )}
            </div>

            {activeView === 'none' && (
                <div className="text-center py-20 text-gray-400 font-bold uppercase text-sm">
                    No modules are enabled for your account. Contact your Super Admin.
                </div>
            )}
            {activeView === 'field' && perms.fieldTeams && <FieldTeamConfig />}
            {activeView === 'hotline' && perms.hotlineStaff && <HotlineConfig />}
            {activeView === 'directory' && perms.teamDirectory && <DirectoryManager />}
            {activeView === 'exports' && perms.exports && <ExportPanel />}
            {activeView === 'audit' && perms.auditLogs && <AuditLogViewer />}
        </div>
    );
};
