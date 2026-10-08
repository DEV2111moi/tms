import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function AdminLayout() {
  return (
    <div className="console">
      <Sidebar />
      <main className="main-area">
        <TopHeader />
        <Outlet />
      </main>
    </div>
  );
}

