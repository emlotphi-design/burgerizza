import { useAdminCheck } from './hooks/useAdminCheck';
import AdminForbidden from './components/AdminForbidden';
import './styles/admin.css';

function AdminLoader() {
  return (
    <div className="adm-loader-page">
      <div className="adm-loader-inner">
        <div className="adm-loader-brand">Burger<span>izza</span></div>
        <div className="adm-loader-ring" />
        <div className="adm-loader-text">Checking permissions…</div>
      </div>
    </div>
  );
}

export default function AdminRoute({ children }) {
  const status = useAdminCheck();

  if (status === 'loading')         return <AdminLoader />;
  if (status === 'unauthenticated') return <AdminForbidden unauthenticated />;
  if (status === 'forbidden')       return <AdminForbidden />;
  return children;
}
