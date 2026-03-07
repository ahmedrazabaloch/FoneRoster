import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Truck, Shield, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/rbac';
import { Button } from '../ui';

export const Header = () => {
    const { user, role, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;

    const handleLogout = async () => {
        await logout();
        setIsMenuOpen(false);
    };

    const NAV_LINK = ({ to, children, onClick }) => (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `px-4 py-2 font-bold text-sm uppercase tracking-wide transition-all border-2 ${isActive
                    ? 'bg-red-600 text-white border-black shadow-brutal'
                    : 'border-transparent hover:border-black hover:shadow-brutal hover:bg-red-50 text-gray-900'
                }`
            }
        >
            {children}
        </NavLink>
    );

    const MOBILE_LINK = ({ to, children, onClick }) => (
        <NavLink
            to={to}
            onClick={() => { setIsMenuOpen(false); onClick?.(); }}
            className={({ isActive }) =>
                `block w-full text-left font-bold text-base py-3 px-3 border-2 min-h-[48px] ${isActive
                    ? 'bg-red-600 text-white border-black'
                    : 'border-transparent text-gray-900'
                }`
            }
        >
            {children}
        </NavLink>
    );

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
                    <div className="hidden md:flex items-center space-x-4">
                        <NAV_LINK to="/">Dashboard</NAV_LINK>
                        <NAV_LINK to="/search">Search</NAV_LINK>

                        {user ? (
                            <>
                                {isAdmin && <NAV_LINK to="/admin">Admin</NAV_LINK>}
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
                                    <span>Login</span>
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
                    <MOBILE_LINK to="/">Dashboard</MOBILE_LINK>
                    <MOBILE_LINK to="/search">Site Search</MOBILE_LINK>

                    {user ? (
                        <>
                            {isAdmin && <MOBILE_LINK to="/admin">Admin Panel</MOBILE_LINK>}
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left font-bold text-base py-3 px-3 text-red-600 min-h-[48px]"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <MOBILE_LINK to="/login">Admin Login</MOBILE_LINK>
                    )}
                </div>
            )}
        </nav>
    );
};
