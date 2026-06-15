import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../styles/tokens.css';
import '../../styles/layout.css';
import '../../styles/sidebar.css';
import '../../styles/topbar.css';
import '../../styles/utilities.css';

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);
    const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), []);

    return (
        <div className="admin-shell">
            <div className="admin-background-layer" />
            <Sidebar open={sidebarOpen} onClose={closeSidebar} />
            {sidebarOpen && (
                <div className="admin-sidebar-backdrop" onClick={closeSidebar} aria-hidden="true" />
            )}
            <div className="admin-main">
                <Topbar onMenuToggle={toggleSidebar} />
                <section className="admin-content-shell">
                    <div className="admin-content-container">
                        <div className="admin-content-area">
                            <Outlet />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
