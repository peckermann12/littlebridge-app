import { useState } from "react";
import {
  Users,
  Building2,
  GraduationCap,
  Inbox,
  Clock,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Mail,
  BarChart3,
  Settings,
  Eye,
  Edit3,
  Star,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatCard {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  iconBg: string;
}

interface Enquiry {
  id: string;
  date: string;
  familyName: string;
  centerName: string;
  status: "pending" | "responded" | "closed";
  phone: string;
  email: string;
}

interface Center {
  id: string;
  name: string;
  suburb: string;
  subscriptionStatus: "active" | "trial" | "expired" | "founding_partner";
  enquiriesThisMonth: number;
  isFoundingPartner: boolean;
}

interface EducatorLead {
  id: string;
  name: string;
  suburb: string;
  languages: string[];
  qualification: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_STATS: StatCard[] = [
  {
    label: "Total Families",
    value: 284,
    change: "+18 this month",
    changeType: "up",
    icon: <Users className="w-5 h-5 text-blue-600" />,
    iconBg: "bg-blue-50",
  },
  {
    label: "Total Centers",
    value: 37,
    change: "+3 this month",
    changeType: "up",
    icon: <Building2 className="w-5 h-5 text-emerald-600" />,
    iconBg: "bg-emerald-50",
  },
  {
    label: "Total Educators",
    value: 156,
    change: "+12 this month",
    changeType: "up",
    icon: <GraduationCap className="w-5 h-5 text-purple-600" />,
    iconBg: "bg-purple-50",
  },
  {
    label: "Enquiries (This Month)",
    value: 89,
    change: "+23% vs last month",
    changeType: "up",
    icon: <Inbox className="w-5 h-5 text-amber-600" />,
    iconBg: "bg-amber-50",
  },
  {
    label: "Pending Enquiries",
    value: 14,
    change: "3 urgent (>48h)",
    changeType: "neutral",
    icon: <Clock className="w-5 h-5 text-orange-600" />,
    iconBg: "bg-orange-50",
  },
  {
    label: "Active Subscriptions",
    value: 29,
    change: "78% of centers",
    changeType: "up",
    icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
    iconBg: "bg-indigo-50",
  },
];

const MOCK_ENQUIRIES: Enquiry[] = [
  {
    id: "enq-001",
    date: "2026-02-28",
    familyName: "Wei Chen",
    centerName: "Little Stars Bilingual",
    status: "pending",
    phone: "0412 345 678",
    email: "wei.chen@gmail.com",
  },
  {
    id: "enq-002",
    date: "2026-02-27",
    familyName: "Li Zhang",
    centerName: "Harmony Kids Chatswood",
    status: "pending",
    phone: "0423 456 789",
    email: "li.zhang@outlook.com",
  },
  {
    id: "enq-003",
    date: "2026-02-27",
    familyName: "Mei Lin Wang",
    centerName: "Panda Cubs Early Learning",
    status: "responded",
    phone: "0434 567 890",
    email: "meilin.w@gmail.com",
  },
  {
    id: "enq-004",
    date: "2026-02-26",
    familyName: "Jing Wu",
    centerName: "Little Stars Bilingual",
    status: "responded",
    phone: "0445 678 901",
    email: "jing.wu@hotmail.com",
  },
  {
    id: "enq-005",
    date: "2026-02-25",
    familyName: "Xiao Yang",
    centerName: "Bilingual Bees Burwood",
    status: "pending",
    phone: "0456 789 012",
    email: "xiao.yang@gmail.com",
  },
  {
    id: "enq-006",
    date: "2026-02-24",
    familyName: "Hao Liu",
    centerName: "Dragon Kids Eastwood",
    status: "closed",
    phone: "0467 890 123",
    email: "hao.liu@yahoo.com",
  },
  {
    id: "enq-007",
    date: "2026-02-23",
    familyName: "Yan Huang",
    centerName: "Harmony Kids Chatswood",
    status: "responded",
    phone: "0478 901 234",
    email: "yan.huang@gmail.com",
  },
  {
    id: "enq-008",
    date: "2026-02-22",
    familyName: "Fang Zhao",
    centerName: "Sunshine Bilingual Epping",
    status: "closed",
    phone: "0489 012 345",
    email: "fang.zhao@outlook.com",
  },
  {
    id: "enq-009",
    date: "2026-02-21",
    familyName: "Ting Zhou",
    centerName: "Little Stars Bilingual",
    status: "responded",
    phone: "0490 123 456",
    email: "ting.zhou@gmail.com",
  },
  {
    id: "enq-010",
    date: "2026-02-20",
    familyName: "Jun Ma",
    centerName: "Panda Cubs Early Learning",
    status: "closed",
    phone: "0401 234 567",
    email: "jun.ma@icloud.com",
  },
];

const MOCK_CENTERS: Center[] = [
  {
    id: "ctr-001",
    name: "Little Stars Bilingual",
    suburb: "Chatswood",
    subscriptionStatus: "founding_partner",
    enquiriesThisMonth: 18,
    isFoundingPartner: true,
  },
  {
    id: "ctr-002",
    name: "Harmony Kids Chatswood",
    suburb: "Chatswood",
    subscriptionStatus: "active",
    enquiriesThisMonth: 14,
    isFoundingPartner: false,
  },
  {
    id: "ctr-003",
    name: "Panda Cubs Early Learning",
    suburb: "Hurstville",
    subscriptionStatus: "active",
    enquiriesThisMonth: 11,
    isFoundingPartner: false,
  },
  {
    id: "ctr-004",
    name: "Bilingual Bees Burwood",
    suburb: "Burwood",
    subscriptionStatus: "founding_partner",
    enquiriesThisMonth: 9,
    isFoundingPartner: true,
  },
  {
    id: "ctr-005",
    name: "Dragon Kids Eastwood",
    suburb: "Eastwood",
    subscriptionStatus: "trial",
    enquiriesThisMonth: 7,
    isFoundingPartner: false,
  },
  {
    id: "ctr-006",
    name: "Sunshine Bilingual Epping",
    suburb: "Epping",
    subscriptionStatus: "active",
    enquiriesThisMonth: 6,
    isFoundingPartner: false,
  },
  {
    id: "ctr-007",
    name: "Ming Yue Childcare",
    suburb: "Hurstville",
    subscriptionStatus: "expired",
    enquiriesThisMonth: 2,
    isFoundingPartner: false,
  },
  {
    id: "ctr-008",
    name: "Rainbow Bridge Learning",
    suburb: "Eastwood",
    subscriptionStatus: "trial",
    enquiriesThisMonth: 5,
    isFoundingPartner: false,
  },
];

const MOCK_EDUCATORS: EducatorLead[] = [
  {
    id: "edu-001",
    name: "Yuki Tanaka",
    suburb: "Chatswood",
    languages: ["Mandarin", "Japanese", "English"],
    qualification: "Diploma in Early Childhood",
    date: "2026-02-27",
  },
  {
    id: "edu-002",
    name: "Shu-Fen Lin",
    suburb: "Burwood",
    languages: ["Mandarin", "English"],
    qualification: "Bachelor of Education (ECE)",
    date: "2026-02-26",
  },
  {
    id: "edu-003",
    name: "Amy Xu",
    suburb: "Epping",
    languages: ["Mandarin", "Cantonese", "English"],
    qualification: "Certificate III in ECEC",
    date: "2026-02-25",
  },
  {
    id: "edu-004",
    name: "Wendy Guo",
    suburb: "Hurstville",
    languages: ["Mandarin", "English"],
    qualification: "Diploma in Early Childhood",
    date: "2026-02-24",
  },
  {
    id: "edu-005",
    name: "Helen Jiang",
    suburb: "Eastwood",
    languages: ["Mandarin", "English"],
    qualification: "Bachelor of Education (ECE)",
    date: "2026-02-22",
  },
  {
    id: "edu-006",
    name: "Rachel Lim",
    suburb: "Chatswood",
    languages: ["Mandarin", "Malay", "English"],
    qualification: "Certificate III in ECEC",
    date: "2026-02-20",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: Enquiry["status"] }) {
  const config = {
    pending: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Clock className="w-3 h-3" />,
    },
    responded: {
      label: "Responded",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    closed: {
      label: "Closed",
      className: "bg-gray-50 text-gray-500 border-gray-200",
      icon: <XCircle className="w-3 h-3" />,
    },
  };

  const { label, className, icon } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

function SubscriptionBadge({
  status,
  isFoundingPartner,
}: {
  status: Center["subscriptionStatus"];
  isFoundingPartner: boolean;
}) {
  if (isFoundingPartner) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <Star className="w-3 h-3 fill-amber-500" />
        Founding Partner
      </span>
    );
  }

  const config = {
    active: {
      label: "Active",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    trial: {
      label: "Trial",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    expired: {
      label: "Expired",
      className: "bg-red-50 text-red-600 border-red-200",
    },
    founding_partner: {
      label: "Founding Partner",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
  };

  const { label, className } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section Components
// ---------------------------------------------------------------------------

function OverviewStats() {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center shrink-0`}
              >
                {stat.icon}
              </div>
            </div>
            {stat.change && (
              <div className="mt-3 flex items-center gap-1">
                {stat.changeType === "up" && (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                )}
                {stat.changeType === "down" && (
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                )}
                {stat.changeType === "neutral" && (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    stat.changeType === "up"
                      ? "text-emerald-600"
                      : stat.changeType === "down"
                        ? "text-red-600"
                        : "text-amber-600"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentEnquiries() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = MOCK_ENQUIRIES.filter((eq) => {
    const matchesStatus =
      statusFilter === "all" || eq.status === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      eq.familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.centerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Recent Enquiries
          <span className="ml-2 text-sm font-normal text-gray-400">
            Last 10
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-8 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="responded">Responded</option>
              <option value="closed">Closed</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Family Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Center
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Contact
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((eq) => (
                <tr
                  key={eq.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(eq.date)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {eq.familyName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{eq.centerName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={eq.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {eq.phone}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {eq.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400 text-sm"
                  >
                    No enquiries match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map((eq) => (
            <div key={eq.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-800">{eq.familyName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {eq.centerName}
                  </p>
                </div>
                <StatusBadge status={eq.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>{formatDate(eq.date)}</span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {eq.phone}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              No enquiries match your filters.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CentersManagement() {
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? MOCK_CENTERS : MOCK_CENTERS.slice(0, 5);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Centers Management
          <span className="ml-2 text-sm font-normal text-gray-400">
            {MOCK_CENTERS.length} centers
          </span>
        </h2>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Center Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Suburb
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Subscription
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">
                  Enquiries
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayed.map((center) => (
                <tr
                  key={center.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        {center.name}
                      </span>
                      {center.isFoundingPartner && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {center.suburb}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <SubscriptionBadge
                      status={center.subscriptionStatus}
                      isFoundingPartner={center.isFoundingPartner}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                      {center.enquiriesThisMonth}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {displayed.map((center) => (
            <div key={center.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-gray-800">{center.name}</p>
                    {center.isFoundingPartner && (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {center.suburb}
                  </p>
                </div>
                <SubscriptionBadge
                  status={center.subscriptionStatus}
                  isFoundingPartner={center.isFoundingPartner}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {center.enquiriesThisMonth} enquiries this month
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more / less */}
        {MOCK_CENTERS.length > 5 && (
          <div className="border-t border-gray-100 px-4 py-2.5">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mx-auto"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show all {MOCK_CENTERS.length} centers{" "}
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function EducatorLeads() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Educator Leads
          <span className="ml-2 text-sm font-normal text-gray-400">
            Recent signups
          </span>
        </h2>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Suburb
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Languages
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Qualification
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_EDUCATORS.map((edu) => (
                <tr
                  key={edu.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {edu.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {edu.suburb}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {edu.languages.map((lang) => (
                        <span
                          key={lang}
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            lang === "Mandarin"
                              ? "bg-red-50 text-red-700"
                              : lang === "Cantonese"
                                ? "bg-orange-50 text-orange-700"
                                : lang === "English"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {edu.qualification}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(edu.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {MOCK_EDUCATORS.map((edu) => (
            <div key={edu.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-800">{edu.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {edu.suburb}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDate(edu.date)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {edu.languages.map((lang) => (
                  <span
                    key={lang}
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      lang === "Mandarin"
                        ? "bg-red-50 text-red-700"
                        : lang === "Cantonese"
                          ? "bg-orange-50 text-orange-700"
                          : lang === "English"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                    }`}
                  >
                    {lang}
                  </span>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                {edu.qualification}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RevenueOverview() {
  const revenueCards = [
    {
      label: "Monthly Recurring Revenue",
      value: "$4,350",
      subtext: "29 active subscriptions x $150/mo avg",
      change: "+12% vs last month",
      changeType: "up" as const,
      icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
      iconBg: "bg-emerald-50",
    },
    {
      label: "Active Trials",
      value: "6",
      subtext: "Converting at 67% rate",
      change: "2 expiring this week",
      changeType: "neutral" as const,
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      iconBg: "bg-blue-50",
    },
    {
      label: "Churn Rate",
      value: "2.8%",
      subtext: "1 cancellation this month",
      change: "-0.5% vs last month",
      changeType: "up" as const,
      icon: <TrendingDown className="w-5 h-5 text-amber-600" />,
      iconBg: "bg-amber-50",
    },
  ];

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Revenue Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {revenueCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <div
                className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}
              >
                {card.icon}
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-gray-400">{card.subtext}</p>
            <div className="mt-3 flex items-center gap-1">
              {card.changeType === "up" && (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              )}
              {card.changeType === "neutral" && (
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  card.changeType === "up"
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {card.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickActions() {
  const actions = [
    {
      label: "Export Enquiries CSV",
      icon: <Download className="w-4 h-4" />,
      className:
        "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
    },
    {
      label: "Send Broadcast Email",
      icon: <Mail className="w-4 h-4" />,
      className:
        "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
    },
    {
      label: "View Analytics",
      icon: <BarChart3 className="w-4 h-4" />,
      className:
        "bg-[#2563EB] border border-[#2563EB] text-white hover:bg-blue-700",
    },
    {
      label: "Manage Subscriptions",
      icon: <Settings className="w-4 h-4" />,
      className:
        "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
    },
  ];

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${action.className}`}
          >
            {action.icon}
            <span className="whitespace-nowrap">{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AdminDashboard() {
  const [sidebarSection, setSidebarSection] = useState("overview");

  const navItems = [
    { key: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "enquiries", label: "Enquiries", icon: <Inbox className="w-4 h-4" /> },
    { key: "centers", label: "Centers", icon: <Building2 className="w-4 h-4" /> },
    { key: "educators", label: "Educators", icon: <GraduationCap className="w-4 h-4" /> },
    { key: "revenue", label: "Revenue", icon: <DollarSign className="w-4 h-4" /> },
  ];

  const scrollTo = (id: string) => {
    setSidebarSection(id);
    const el = document.getElementById(`admin-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* Top Header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
                <span className="text-white text-sm font-bold">LB</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  LittleBridge Admin
                </h1>
                <p className="text-xs text-gray-400 -mt-0.5">
                  Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-gray-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                All systems operational
              </span>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-600">PA</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* -------------------------------------------------------------- */}
          {/* Sidebar Navigation (desktop)                                     */}
          {/* -------------------------------------------------------------- */}
          <aside className="hidden lg:block w-52 shrink-0">
            <nav className="sticky top-24 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => scrollTo(item.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sidebarSection === item.key
                      ? "bg-blue-50 text-[#2563EB]"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => scrollTo("actions")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Quick Actions
                </button>
              </div>
            </nav>
          </aside>

          {/* -------------------------------------------------------------- */}
          {/* Main Content                                                     */}
          {/* -------------------------------------------------------------- */}
          <main className="flex-1 min-w-0 space-y-8">
            {/* Mobile navigation pills */}
            <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => scrollTo(item.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[32px] ${
                    sidebarSection === item.key
                      ? "bg-[#2563EB] text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            <div id="admin-overview">
              <OverviewStats />
            </div>

            <div id="admin-enquiries">
              <RecentEnquiries />
            </div>

            <div id="admin-centers">
              <CentersManagement />
            </div>

            <div id="admin-educators">
              <EducatorLeads />
            </div>

            <div id="admin-revenue">
              <RevenueOverview />
            </div>

            <div id="admin-actions">
              <QuickActions />
            </div>

            {/* Footer spacer */}
            <div className="pt-4 pb-8 border-t border-gray-200 mt-8">
              <p className="text-xs text-gray-400 text-center">
                LittleBridge Admin Dashboard -- Demo Data -- Not connected to
                production database
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
