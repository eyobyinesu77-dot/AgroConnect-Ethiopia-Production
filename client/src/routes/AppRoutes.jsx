import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import PublicLayout from '../layouts/PublicLayout';

// Public Pages
import Home from '../pages/public/Home';
import Marketplace from '../pages/public/Marketplace';
import ProductDetails from '../pages/public/ProductDetails';
import About from '../pages/public/About';
import Contact from '../pages/public/Contact';
import FAQ from '../pages/public/FAQ';
import PrivacyPolicy from '../pages/public/PrivacyPolicy';
import Terms from '../pages/public/Terms';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import VerifyEmail from '../pages/auth/VerifyEmail';
import ChangePassword from '../pages/auth/ChangePassword';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminFarmers from '../pages/admin/Farmers';
import AdminBuyers from '../pages/admin/Buyers';
import AdminExtensionWorkers from '../pages/admin/ExtensionWorkers';
import AdminProducts from '../pages/admin/Products';
import AdminOrders from '../pages/admin/Orders';
import AdminCategories from '../pages/admin/Categories';
import AdminLoans from '../pages/admin/Loans';
import AdminPayments from '../pages/admin/Payments';
import AdminReports from '../pages/admin/Reports';
import AdminAnalytics from '../pages/admin/Analytics';
import AdminNotifications from '../pages/admin/Notifications';
import AdminSupport from '../pages/admin/Support';
import AdminMessages from '../pages/admin/Messages';
import AdminSettings from '../pages/admin/Settings';
import AdminProfile from '../pages/admin/Profile';

// Farmer Pages
import FarmerDashboard from '../pages/farmer/Dashboard';
import FarmerCompleteProfile from '../pages/farmer/CompleteProfile';
import FarmerMyProducts from '../pages/farmer/MyProducts';
import SellCrop from '../pages/farmer/SellCrop';
import FarmerOrders from '../pages/farmer/Orders';
import FarmerLoans from '../pages/farmer/Loans';
import FarmerWeather from '../pages/farmer/Weather';
import FarmerAdvice from '../pages/farmer/Advice';
import FarmerTrainings from '../pages/farmer/Trainings';
import FarmerVisits from '../pages/farmer/Visits';
import FarmerCropConditions from '../pages/farmer/CropConditions';
import FarmerMessages from '../pages/farmer/Messages';
import FarmerProfile from '../pages/farmer/Profile';
import FarmerSettings from '../pages/farmer/Settings';

// Buyer Pages
import BuyerDashboard from '../pages/buyer/Dashboard';
import BuyerCart from '../pages/buyer/Cart';
import BuyerCheckout from '../pages/buyer/Checkout';
import BuyerOrders from '../pages/buyer/Orders';
import BuyerWishlist from '../pages/buyer/Wishlist';
import BuyerMessages from '../pages/buyer/Messages';
import BuyerProfile from '../pages/buyer/Profile';
import BuyerSettings from '../pages/buyer/Settings';

// Extension Pages
import ExtensionDashboard from '../pages/extension/Dashboard';
import ExtensionFarmers from '../pages/extension/Farmers';
import ExtensionVisits from '../pages/extension/Visits';
import ExtensionAdvice from '../pages/extension/Advice';
import ExtensionWeather from '../pages/extension/Weather';
import ExtensionReports from '../pages/extension/Reports';
import ExtensionTrainings from '../pages/extension/Trainings';
import ExtensionCropConditions from '../pages/extension/CropConditions';
import ExtensionMessages from '../pages/extension/Messages';
import ExtensionProfile from '../pages/extension/Profile';
import ExtensionSettings from '../pages/extension/Settings';

// NotFound
import NotFound from '../pages/public/NotFound';

function withDashboard(Page, allowedRoles) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <DashboardLayout>
        <Page />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function withPublic(Page) {
  return (
    <PublicLayout>
      <Page />
    </PublicLayout>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={withPublic(Home)} />
      <Route path="/marketplace" element={withPublic(Marketplace)} />
      <Route path="/marketplace/:id" element={withPublic(ProductDetails)} />
      <Route path="/about" element={withPublic(About)} />
      <Route path="/contact" element={withPublic(Contact)} />
      <Route path="/faq" element={withPublic(FAQ)} />
      <Route path="/privacy-policy" element={withPublic(PrivacyPolicy)} />
      <Route path="/terms" element={withPublic(Terms)} />

      {/* Auth Routes */}
      <Route path="/login" element={withPublic(Login)} />
      <Route path="/register" element={withPublic(Register)} />
      <Route path="/forgot-password" element={withPublic(ForgotPassword)} />
      <Route path="/reset-password" element={withPublic(ResetPassword)} />
      <Route path="/verify-email" element={withPublic(VerifyEmail)} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={withDashboard(AdminDashboard, ['admin'])} />
      <Route path="/admin/users" element={withDashboard(AdminUsers, ['admin'])} />
      <Route path="/admin/farmers" element={withDashboard(AdminFarmers, ['admin'])} />
      <Route path="/admin/buyers" element={withDashboard(AdminBuyers, ['admin'])} />
      <Route path="/admin/extension-workers" element={withDashboard(AdminExtensionWorkers, ['admin'])} />
      <Route path="/admin/products" element={withDashboard(AdminProducts, ['admin'])} />
      <Route path="/admin/orders" element={withDashboard(AdminOrders, ['admin'])} />
      <Route path="/admin/categories" element={withDashboard(AdminCategories, ['admin'])} />
      <Route path="/admin/loans" element={withDashboard(AdminLoans, ['admin'])} />
      <Route path="/admin/payments" element={withDashboard(AdminPayments, ['admin'])} />
      <Route path="/admin/reports" element={withDashboard(AdminReports, ['admin'])} />
      <Route path="/admin/analytics" element={withDashboard(AdminAnalytics, ['admin'])} />
      <Route path="/admin/notifications" element={withDashboard(AdminNotifications, ['admin'])} />
      <Route path="/admin/support" element={withDashboard(AdminSupport, ['admin'])} />
      <Route path="/admin/messages" element={withDashboard(AdminMessages, ['admin'])} />
      <Route path="/admin/settings" element={withDashboard(AdminSettings, ['admin'])} />
      <Route path="/admin/profile" element={withDashboard(AdminProfile, ['admin'])} />

      {/* Farmer Routes */}
      <Route path="/farmer/complete-profile" element={withDashboard(FarmerCompleteProfile, ['farmer'])} />
      <Route path="/farmer/dashboard" element={withDashboard(FarmerDashboard, ['farmer'])} />
      <Route path="/farmer/products" element={withDashboard(FarmerMyProducts, ['farmer'])} />
      <Route path="/farmer/sell-crop" element={withDashboard(SellCrop, ['farmer'])} />
      <Route path="/farmer/orders" element={withDashboard(FarmerOrders, ['farmer'])} />
      <Route path="/farmer/loans" element={withDashboard(FarmerLoans, ['farmer'])} />
      <Route path="/farmer/weather" element={withDashboard(FarmerWeather, ['farmer'])} />
      <Route path="/farmer/advice" element={withDashboard(FarmerAdvice, ['farmer'])} />
      <Route path="/farmer/trainings" element={withDashboard(FarmerTrainings, ['farmer'])} />
      <Route path="/farmer/visits" element={withDashboard(FarmerVisits, ['farmer'])} />
      <Route path="/farmer/crop-conditions" element={withDashboard(FarmerCropConditions, ['farmer'])} />
      <Route path="/farmer/messages" element={withDashboard(FarmerMessages, ['farmer'])} />
      <Route path="/farmer/profile" element={withDashboard(FarmerProfile, ['farmer'])} />
      <Route path="/farmer/settings" element={withDashboard(FarmerSettings, ['farmer'])} />

      {/* Buyer Routes */}
      <Route path="/buyer/dashboard" element={withDashboard(BuyerDashboard, ['buyer'])} />
      <Route path="/buyer/marketplace" element={withDashboard(Marketplace, ['buyer'])} />
      <Route path="/buyer/marketplace/:id" element={withDashboard(ProductDetails, ['buyer'])} />
      <Route path="/buyer/cart" element={withDashboard(BuyerCart, ['buyer'])} />
      <Route path="/buyer/checkout" element={withDashboard(BuyerCheckout, ['buyer'])} />
      <Route path="/buyer/orders" element={withDashboard(BuyerOrders, ['buyer'])} />
      <Route path="/buyer/wishlist" element={withDashboard(BuyerWishlist, ['buyer'])} />
      <Route path="/buyer/messages" element={withDashboard(BuyerMessages, ['buyer'])} />
      <Route path="/buyer/profile" element={withDashboard(BuyerProfile, ['buyer'])} />
      <Route path="/buyer/settings" element={withDashboard(BuyerSettings, ['buyer'])} />

      {/* Extension Worker Routes */}
      <Route path="/extension/dashboard" element={withDashboard(ExtensionDashboard, ['extension'])} />
      <Route path="/extension/farmers" element={withDashboard(ExtensionFarmers, ['extension'])} />
      <Route path="/extension/visits" element={withDashboard(ExtensionVisits, ['extension'])} />
      <Route path="/extension/advice" element={withDashboard(ExtensionAdvice, ['extension'])} />
      <Route path="/extension/weather" element={withDashboard(ExtensionWeather, ['extension'])} />
      <Route path="/extension/reports" element={withDashboard(ExtensionReports, ['extension'])} />
      <Route path="/extension/trainings" element={withDashboard(ExtensionTrainings, ['extension'])} />
      <Route path="/extension/crop-conditions" element={withDashboard(ExtensionCropConditions, ['extension'])} />
      <Route path="/extension/messages" element={withDashboard(ExtensionMessages, ['extension'])} />
      <Route path="/extension/profile" element={withDashboard(ExtensionProfile, ['extension'])} />
      <Route path="/extension/settings" element={withDashboard(ExtensionSettings, ['extension'])} />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
