import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { adminService } from "../../services/adminService";
import { productService } from "../../services/productService";
import { orderService } from "../../services/orderService";
import { loanService } from "../../services/loanService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useLanguage } from "../../context/LanguageContext";


export default function AdminDashboard() {
  const { t, formatNumber } = useLanguage();
  // The fetch below runs once, but the user's saved language can be applied
  // right after mount (login / page reload). Read `t` through a ref so the
  // error toast uses the language that is active when it fires.
  const tRef = useRef(t);
  tRef.current = t;

  const QUICK_ACTIONS = [
    { label: t("qa_manage_farmers"), to: "/admin/farmers", icon: "👨‍🌾", color: "bg-green-50 text-green-700" },
    { label: t("qa_manage_buyers"), to: "/admin/buyers", icon: "🛒", color: "bg-blue-50 text-blue-700" },
    { label: t("qa_extension_workers"), to: "/admin/extension-workers", icon: "👩‍🔬", color: "bg-purple-50 text-purple-700" },
    { label: t("qa_manage_products"), to: "/admin/products", icon: "📦", color: "bg-amber-50 text-amber-700" },
    { label: t("qa_manage_orders"), to: "/admin/orders", icon: "🧾", color: "bg-cyan-50 text-cyan-700" },
    { label: t("qa_manage_loans"), to: "/admin/loans", icon: "💰", color: "bg-rose-50 text-rose-700" },
    { label: t("nav_logistics"), to: "/admin/logistics", icon: "🚚", color: "bg-orange-50 text-orange-700" },
    { label: t("qa_view_reports"), to: "/admin/reports", icon: "📊", color: "bg-slate-100 text-slate-700" },
    { label: t("qa_analytics"), to: "/admin/analytics", icon: "📈", color: "bg-indigo-50 text-indigo-700" },
  ];

  const [stats, setStats] = useState(null);
  const [activeCrops, setActiveCrops] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingLoans, setPendingLoans] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

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
        // Flag the failure; the toast itself is raised in an effect below so it
        // renders in the language active after this render (not at mount time).
        if (isMounted) setLoadFailed(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    // Always show the translated message; the backend message is English-only.
    if (loadFailed) toast.error(tRef.current('analytics_load_error'));
  }, [loadFailed]);

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label={t("admindash_loading")} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t("admindash_title")}</h1>
          <p className="text-slate-500 text-sm">{t("admindash_subtitle")}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link to="/admin/users" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-xs font-semibold uppercase">{t("admindash_card_total_users")}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatNumber(stats?.totalUsers ?? 0)}</p>
          </Link>
          <Link to="/admin/products" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-xs font-semibold uppercase">{t("admindash_card_active_crops")}</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{formatNumber(activeCrops)}</p>
          </Link>
          <Link to="/admin/orders" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-xs font-semibold uppercase">{t("admindash_card_total_orders")}</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{formatNumber(totalOrders)}</p>
          </Link>
          <Link to="/admin/loans" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-xs font-semibold uppercase">{t("admindash_card_pending_loans")}</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{formatNumber(pendingLoans)}</p>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{t("dashboard_quick_actions")}</h2>
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
