import { Outlet } from 'react-router-dom';
import NewSidebar from './NewSidebar';
import NewTopbar from './NewTopbar';
import NewContentShell from './NewContentShell';
import './styles/new-admin.css';

export default function NewAdminLayout() {
    return (
        <div className="newadm-shell">
            <div className="newadm-background-layer" />
            <NewSidebar />
            <div className="newadm-main">
                <NewTopbar />
                <NewContentShell>
                    <Outlet />
                </NewContentShell>
            </div>
        </div>
    );
}
