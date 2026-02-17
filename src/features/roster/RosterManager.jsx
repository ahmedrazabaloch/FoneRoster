import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { FieldTeamConfig } from './FieldTeamConfig';
import { HotlineConfig } from './HotlineConfig';
import { DirectoryManager } from '../directory/DirectoryManager';

export const RosterManager = () => {
    const [activeView, setActiveView] = useState('field');

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8 border-b-4 border-black pb-4">
                <h1 className="text-4xl font-black uppercase">Roster Control</h1>
            </div>

            <div className="flex flex-wrap gap-4 mb-8">
                <Button
                    onClick={() => setActiveView('field')}
                    variant={activeView === 'field' ? 'primary' : 'ghost'}
                >
                    Field Teams
                </Button>
                <Button
                    onClick={() => setActiveView('hotline')}
                    variant={activeView === 'hotline' ? 'primary' : 'ghost'}
                >
                    Hotline Staff
                </Button>
                <Button
                    onClick={() => setActiveView('directory')}
                    variant={activeView === 'directory' ? 'secondary' : 'ghost'}
                    className="flex items-center space-x-2"
                >
                    <Briefcase size={18} />
                    <span>Team Directory</span>
                </Button>
            </div>

            {activeView === 'field' && <FieldTeamConfig />}
            {activeView === 'hotline' && <HotlineConfig />}
            {activeView === 'directory' && <DirectoryManager />}
        </div>
    );
};
