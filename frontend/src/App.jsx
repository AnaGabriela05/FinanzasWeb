import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import PaymentMethods from './pages/PaymentMethods'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Reports from './pages/Reports'
import Learning from './pages/Learning'
import UserRoute from './routes/UserRoute'
import AdminRoute from './routes/AdminRoute'
import AdminLayout from './layouts/AdminLayout'
import PreviewLayout from './layouts/PreviewLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminGlobalCategories from './pages/admin/AdminGlobalCategories'
import AdminAudit from './pages/admin/AdminAudit'
import { Auth } from './lib/auth'
import { setExchangeRate } from './lib/currency'

function landingTarget() {
  if (!Auth.isLoggedIn()) return null
  return Auth.user()?.role === 'admin' ? '/admin' : '/dashboard'
}

export default function App() {
  useEffect(() => {
    fetch('/api/config/currency')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.usdToPen) setExchangeRate(data.usdToPen)
      })
      .catch(() => {
        // Si falla queda el default 3.75 hardcodeado en lib/currency.js.
      })
  }, [])

  const landing = landingTarget()

  return (
    <BrowserRouter>
      <Routes>
        {/* Publicas */}
        <Route path="/" element={landing ? <Navigate to={landing} replace /> : <Login />} />
        <Route path="/register" element={landing ? <Navigate to={landing} replace /> : <Register />} />

        {/* Privadas - usuario regular */}
        <Route path="/dashboard"       element={<UserRoute><Dashboard /></UserRoute>} />
        <Route path="/categories"      element={<UserRoute><Categories /></UserRoute>} />
        <Route path="/payment-methods" element={<UserRoute><PaymentMethods /></UserRoute>} />
        <Route path="/transactions"    element={<UserRoute><Transactions /></UserRoute>} />
        <Route path="/budgets"         element={<UserRoute><Budgets /></UserRoute>} />
        <Route path="/reports"         element={<UserRoute><Reports /></UserRoute>} />
        <Route path="/learning"        element={<UserRoute><Learning /></UserRoute>} />

        {/* Privadas - admin */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/metrics" replace />} />
          <Route path="metrics"    element={<AdminDashboard />} />
          <Route path="users"      element={<AdminUsers />} />
          <Route path="categories" element={<AdminGlobalCategories />} />
          <Route path="audit"      element={<AdminAudit />} />
        </Route>

        {/* Modo Vista Preview - solo admins */}
        <Route path="/admin/preview" element={<AdminRoute><PreviewLayout /></AdminRoute>}>
          <Route path="dashboard"       element={<Dashboard />} />
          <Route path="categories"      element={<Categories />} />
          <Route path="payment-methods" element={<PaymentMethods />} />
          <Route path="transactions"    element={<Transactions />} />
          <Route path="budgets"         element={<Budgets />} />
          <Route path="reports"         element={<Reports />} />
          <Route path="learning"        element={<Learning />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
