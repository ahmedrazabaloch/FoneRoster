import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Truck, Shield, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui';

export const Header = () => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        setIsMenuOpen(false);
    };

    return (
        <nav className="bg-white border-b-4 border-black sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 md:h-20">
                    <NavLink to="/" className="flex items-center space-x-2 md:space-x-3">
                        <div className="bg-red-600 p-1.5 md:p-2 border-2 border-black shadow-brutal-sm md:shadow-brutal">
                            <Truck className="h-5 w-5 md:h-6 md:w-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-base md:text-2xl uppercase tracking-tighter leading-none">
                                Formula One
                            </span>
                            <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Telecom Logistics
                            </span>
                        </div>
                    </NavLink>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-6">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `px-4 py-2 font-bold text-sm uppercase tracking-wide transition-all border-2 ${isActive
                                    ? 'bg-red-600 text-white border-black shadow-brutal'
                                    : 'border-transparent hover:border-black hover:shadow-brutal hover:bg-red-50 text-gray-900'
                                }`
                            }
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/search"
                            className={({ isActive }) =>
                                `px-4 py-2 font-bold text-sm uppercase tracking-wide transition-all border-2 ${isActive
                                    ? 'bg-red-600 text-white border-black shadow-brutal'
                                    : 'border-transparent hover:border-black hover:shadow-brutal hover:bg-red-50 text-gray-900'
                                }`
                            }
                        >
                            Search
                        </NavLink>
                        {user ? (
                            <>
                                <NavLink
                                    to="/admin"
                                    className={({ isActive }) =>
                                        `px-4 py-2 font-bold text-sm uppercase tracking-wide border-2 ${isActive
                                            ? 'bg-black text-white border-black'
                                            : 'border-transparent hover:border-black hover:shadow-brutal text-gray-900'
                                        }`
                                    }
                                >
                                    Admin
                                </NavLink>
                                <Button
                                    onClick={handleLogout}
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center space-x-2"
                                >
                                    <LogOut size={16} />
                                    <span>Exit</span>
                                </Button>
                            </>
                        ) : (
                            <NavLink to="/login">
                                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                                    <Shield size={16} />
                                    <span>Admin</span>
                                </Button>
                            </NavLink>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 border-2 border-black shadow-brutal-sm min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t-2 border-black p-3 space-y-1">
                    <NavLink
                        to="/"
                        onClick={() => setIsMenuOpen(false)}
                        className={({ isActive }) =>
                            `block w-full text-left font-bold text-base py-3 px-3 border-2 min-h-[48px] ${isActive
                                ? 'bg-red-600 text-white border-black'
                                : 'border-transparent text-gray-900'
                            }`
                        }
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/search"
                        onClick={() => setIsMenuOpen(false)}
                        className={({ isActive }) =>
                            `block w-full text-left font-bold text-base py-3 px-3 border-2 min-h-[48px] ${isActive
                                ? 'bg-red-600 text-white border-black'
                                : 'border-transparent text-gray-900'
                            }`
                        }
                    >
                        Site Search
                    </NavLink>
                    {user ? (
                        <>
                            <NavLink
                                to="/admin"
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) =>
                                    `block w-full text-left font-bold text-base py-3 px-3 border-2 min-h-[48px] ${isActive
                                        ? 'bg-black text-white border-black'
                                        : 'border-transparent text-gray-900'
                                    }`
                                }
                            >
                                Admin Panel
                            </NavLink>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left font-bold text-base py-3 px-3 text-red-600 min-h-[48px]"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <NavLink
                            to="/login"
                            onClick={() => setIsMenuOpen(false)}
                            className="block w-full text-left font-bold text-base py-3 px-3 min-h-[48px]"
                        >
                            Admin Login
                        </NavLink>
                    )}
                </div>
            )}
        </nav>
    );
};
