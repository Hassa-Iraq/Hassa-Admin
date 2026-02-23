'use client';

import { useState } from 'react';
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../i18n/LanguageContext";

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { dir } = useLanguage();
    const isRTL = dir === 'rtl';

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className={isRTL ? 'md:mr-64' : 'md:ml-64'}>
                <main className="p-0">
                    {!sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className={`fixed top-3 z-50 md:hidden w-10 h-10 rounded-lg bg-white shadow-md flex items-center justify-center text-purple-600 border border-gray-200 ${isRTL ? 'right-3' : 'left-3'}`}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
