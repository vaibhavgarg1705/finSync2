import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export default function Layout() {
  const { batchId } = useApp();
  const loc = useLocation();
  const link = (to, text) => (
    <NavLink to={to} end className={({ isActive }) => (isActive ? 'active' : '')}>
      {text}
    </NavLink>
  );
  return (
    <div className="app">
      <header className="nav">
        <div className="brand">FinSync</div>
        <nav className="links">
          {link('/', 'Dashboard')}
          {link('/import/invoices', 'Import Invoices')}
          {link('/import/payments', 'Import Payments')}
          {link('/matching', 'Matching')}
          {link('/suggestions', 'Suggestions')}
          {link('/allocations', 'Manual Allocation')}
        </nav>
        <div className="spacer" />
        <div className="batch">
          {batchId ? <>Batch: <strong>{batchId}</strong></> : 'No batch selected'}
        </div>
      </header>
      <main className="main" key={loc.pathname}>
        <Outlet />
      </main>
    </div>
  );
}