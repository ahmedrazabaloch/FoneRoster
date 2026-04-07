/**
 * AppLayout.jsx — Main Application Layout
 *
 * Provides the overall layout structure for the entire application.
 * Wraps all routes with necessary providers and UI components.
 */
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { routeConfig } from './routes';

export const AppLayout = () => {
    return (
        <div className="flex min-h-screen flex-col overflow-x-hidden font-sans text-gray-900 selection:bg-red-200">
            <Header />
            <main className="flex-1">
                <Suspense
                    fallback={
                        <div className="min-h-screen flex items-center justify-center">
                            <LoadingSpinner message="Loading page..." />
                        </div>
                    }
                >
                    <Routes>
                        {routeConfig.map((route) => (
                            <Route
                                key={route.path}
                                path={route.path}
                                element={route.element}
                            />
                        ))}
                    </Routes>
                </Suspense>
            </main>
            <Footer />
        </div>
    );
};
