import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Activity, Database, LayoutDashboard, LineChart as LineChartIcon, PieChart } from 'lucide-react'
import { Dashboard } from './pages/Dashboard'
import { DataManagement } from './pages/DataManagement'
import { ExchangeRates } from './pages/ExchangeRates'
import { Funds } from './pages/Funds'
import './index.css'

function SideNav() {
  const location = useLocation();

  return (
    <nav className="sidebar">
      <div className="logo-container">
        <Activity color="#3b82f6" size={28} className="icon-pulse" />
        <h2 className="logo-text">FinanceSys</h2>
      </div>
      <div className="nav-menu">
        <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>營運戰情室</span>
        </Link>
        <Link to="/exchange-rates" className={`nav-item ${location.pathname === '/exchange-rates' ? 'active' : ''}`}>
          <LineChartIcon size={20} />
          <span>匯率走勢分析</span>
        </Link>
        <Link to="/funds" className={`nav-item ${location.pathname === '/funds' ? 'active' : ''}`}>
          <PieChart size={20} />
          <span>基金淨值分析</span>
        </Link>
        <Link to="/data" className={`nav-item ${location.pathname === '/data' ? 'active' : ''}`}>
          <Database size={20} />
          <span>系統設定管理</span>
        </Link>
      </div>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <SideNav />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/exchange-rates" element={<ExchangeRates />} />
            <Route path="/funds" element={<Funds />} />
            <Route path="/data" element={<DataManagement />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
