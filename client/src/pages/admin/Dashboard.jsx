import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { adminService } from "../../services/adminService";
import { productService } from "../../services/productService";
import { orderService } from "../../services/orderService";
import { loanService } from "../../services/loanService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const QUICK_ACTIONS = [
  { label: "Manage Farmers", to: "/admin/farmers", icon: "👨‍🌾", color: "bg-green-50 text-green-700" },
  { label: "Manage Buyers", to: "/admin/buyers", icon: "🛒", color: "bg-blue-50 text-blue-700" },
  { label: "Extension Workers", to: "/admin/extension-workers", icon: "👩‍🔬", color: "bg-purple-50 text-purple-700" },
  { label: "Manage Products", to: "/admin/products", icon: "📦", color: "bg-amber-50 text-amber-700" },
  { label: "Manage Orders", to: "/admin/orders", icon: "🧾", color: "bg-cyan-50 text-cyan-700" },
  { label: "Manage Loans", to: "/admin/loans", icon: "💰", color: "bg-rose-50 text-rose-700" },
  { label: "View Reports", to: "/admin/reports", icon: "📊", color: "bg-slate-100 text-slate-700" },
  { label: "Analytics", to: "/admin/analytics", icon: "📈", color: "bg-indigo-50 text-indigo-700" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activeCrops, setActiveCrops] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingLoans, setPendingLoans] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [statsData, products, orders, loans] = await Promise.all([
          adminService.getStats(),
          productService.getAllProducts(),
          orderService.getAllOrders(),
          loanService.getAllLoans(),
        ]);

        if (!isMounted) return;
        setStats(statsData);
        setActiveCrops(products.filter((p) => p.listingStatus === 'Active').length);
        setTotalOrders(orders.length);
        setPendingLoans(loans.filter((l) => l.status === 'Pending').length);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">⚙️ System Admin Dashboard</h1>
          <p className="text-slate-500 text-sm">Manage AgroConnect users, product approvals, and platform metrics.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link to="/admin/users" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-xs font-semibold uppercase">Total Users</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.totalUsers ?? 0}</p>
          </Link>
          <Link to="/admin/products" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-xs font-semibold uppercase">Active Crops</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{activeCrops}</p>
          </Link>
          <Link to="/admin/orders" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-xs font-semibold uppercase">Total Orders</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{totalOrders}</p>
          </Link>
          <Link to="/admin/loans" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-xs font-semibold uppercase">Pending Loan Requests</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingLoans}</p>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl font-semibold text-sm text-center ${action.color} hover:opacity-80 transition-opacity`}
              >
                <span className="text-2xl">{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
