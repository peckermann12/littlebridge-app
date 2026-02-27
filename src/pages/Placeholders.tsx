/**
 * Placeholder page components for routes that have not been built yet.
 *
 * Each export renders a centered heading with the page name so the router
 * compiles and every route resolves to visible content.
 */

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-24 px-4">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Public pages                                                        */
/* ------------------------------------------------------------------ */

export function Landing() {
  return <PlaceholderPage title="Landing" />;
}

export function CenterSearch() {
  return <PlaceholderPage title="Center Search" />;
}

export function CenterDetail() {
  return <PlaceholderPage title="Center Detail" />;
}

export function GuestEnquiry() {
  return <PlaceholderPage title="Guest Enquiry" />;
}

export function JobSearch() {
  return <PlaceholderPage title="Job Search" />;
}

export function EducatorSignUp() {
  return <PlaceholderPage title="Educator Sign Up" />;
}

export function SignIn() {
  return <PlaceholderPage title="Sign In" />;
}

export function SignUp() {
  return <PlaceholderPage title="Sign Up" />;
}

export function VerifyEmail() {
  return <PlaceholderPage title="Verify Email" />;
}

export function ForgotPassword() {
  return <PlaceholderPage title="Forgot Password" />;
}

export function ResetPassword() {
  return <PlaceholderPage title="Reset Password" />;
}

export function About() {
  return <PlaceholderPage title="About" />;
}

export function CCSGuide() {
  return <PlaceholderPage title="CCS Guide" />;
}

export function NotFound() {
  return <PlaceholderPage title="404 — Page Not Found" />;
}

/* ------------------------------------------------------------------ */
/* Protected — Family                                                  */
/* ------------------------------------------------------------------ */

export function FamilyProfile() {
  return <PlaceholderPage title="Family Profile" />;
}

export function FamilyEnquiries() {
  return <PlaceholderPage title="Family Enquiries" />;
}

/* ------------------------------------------------------------------ */
/* Protected — Center                                                  */
/* ------------------------------------------------------------------ */

export function CenterOnboard() {
  return <PlaceholderPage title="Center Onboarding" />;
}

export function CenterProfile() {
  return <PlaceholderPage title="Center Profile" />;
}

export function CenterDashboard() {
  return <PlaceholderPage title="Center Dashboard" />;
}

export function CenterJobPost() {
  return <PlaceholderPage title="Post a Job" />;
}

/* ------------------------------------------------------------------ */
/* Protected — Admin                                                   */
/* ------------------------------------------------------------------ */

export function AdminDashboard() {
  return <PlaceholderPage title="Admin Dashboard" />;
}
