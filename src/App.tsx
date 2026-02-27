import { Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public pages
import Landing from "@/pages/Landing";
import About from "@/pages/About";
import CCSGuide from "@/pages/CCSGuide";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";

// Search (public, no auth required)
import CenterSearch from "@/pages/search/CenterSearch";
import CenterDetail from "@/pages/search/CenterDetail";
import GuestEnquiry from "@/pages/search/GuestEnquiry";

// Auth pages
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

// Educators (public)
import EducatorSignUp from "@/pages/educators/EducatorSignUp";

// Center (mix of public + protected)
import CenterOnboard from "@/pages/center/CenterOnboard";
import CenterProfile from "@/pages/center/CenterProfile";
import CenterDashboard from "@/pages/center/CenterDashboard";
import CenterJobPost from "@/pages/center/CenterJobPost";

// Family (protected)
import FamilyProfile from "@/pages/family/FamilyProfile";
import FamilyEnquiries from "@/pages/family/FamilyEnquiries";

// Admin (protected)
import AdminDashboard from "@/pages/admin/AdminDashboard";

// Placeholder for routes not yet built
import { JobSearch, NotFound } from "@/pages/Placeholders";

// ---------------------------------------------------------------------------
// Layout wrapper — Header on top, Footer on bottom, content fills the middle
// ---------------------------------------------------------------------------

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* ---- Public ---- */}
        <Route path="/" element={<Landing />} />
        <Route path="/search" element={<CenterSearch />} />
        <Route path="/centers/:slug" element={<CenterDetail />} />
        <Route path="/centers/:slug/enquiry" element={<GuestEnquiry />} />
        <Route path="/jobs" element={<JobSearch />} />
        <Route path="/educators/signup" element={<EducatorSignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/ccs-guide" element={<CCSGuide />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* ---- Center onboarding (public landing, no auth) ---- */}
        <Route path="/center/onboard" element={<CenterOnboard />} />

        {/* ---- Protected: Family ---- */}
        <Route
          path="/family/profile"
          element={
            <ProtectedRoute requiredRole="family">
              <FamilyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family/enquiries"
          element={
            <ProtectedRoute requiredRole="family">
              <FamilyEnquiries />
            </ProtectedRoute>
          }
        />

        {/* ---- Protected: Center ---- */}
        <Route
          path="/center/profile"
          element={
            <ProtectedRoute requiredRole="center">
              <CenterProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/center/dashboard"
          element={
            <ProtectedRoute requiredRole="center">
              <CenterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/center/dashboard/jobs/new"
          element={
            <ProtectedRoute requiredRole="center">
              <CenterJobPost />
            </ProtectedRoute>
          }
        />

        {/* ---- Protected: Admin ---- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* ---- Catch-all ---- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
