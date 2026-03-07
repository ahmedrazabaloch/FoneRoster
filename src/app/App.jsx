/**
 * App.jsx — Main Application Entry Point
 *
 * This is the root component that sets up:
 *  - Error boundaries for graceful error handling
 *  - Authentication context (AuthProvider)
 *  - Roster context (RosterProvider)
 *  - Router (BrowserRouter)
 *  - Toast notifications (Toaster)
 *  - Main layout (AppLayout)
 */
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '../auth/AuthContext';
import { RosterProvider } from '../context/RosterContext';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';
import { AppLayout } from './AppLayout';

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <RosterProvider>
                    <BrowserRouter>
                        <AppLayout />
                        <Toaster position="top-center" richColors />
                    </BrowserRouter>
                </RosterProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
