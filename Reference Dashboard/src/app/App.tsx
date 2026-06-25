import { useState } from "react";
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  ChevronRight,
  Bell,
  Settings,
  LayoutDashboard,
  BookOpen,
  MapPin,
  Plus,
  CheckCircle,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const courts = [
  { id: 1, name: "Court A", sport: "Tennis", status: "available", nextSlot: "10:00" },
  { id: 2, name: "Court B", sport: "Tennis", status: "occupied", nextSlot: "11:30" },
  { id: 3, name: "Court C", sport: "Basketball", status: "occupied", nextSlot: "12:00" },
  { id: 4, name: "Court D", sport: "Badminton", status: "available", nextSlot: "09:30" },
  { id: 5, name: "Court E", sport: "Squash", status: "maintenance", nextSlot: "14:00" },
  { id: 6, name: "Court F", sport: "Volleyball", status: "available", nextSlot: "10:30" },
];

const upcomingBookings = [
  { id: 1, court: "Court A", sport: "Tennis", user: "Marcus Rivera", time: "10:00 – 11:00", date: "Today", avatar: "MR" },
  { id: 2, court: "Court D", sport: "Badminton", user: "Sara Lindqvist", time: "09:30 – 10:30", date: "Today", avatar: "SL" },
  { id: 3, court: "Court F", sport: "Volleyball", user: "James Park", time: "10:30 – 12:00", date: "Today", avatar: "JP" },
  { id: 4, court: "Court B", sport: "Tennis", user: "Amara Diallo", time: "12:00 – 13:00", date: "Tomorrow", avatar: "AD" },
  { id: 5, court: "Court C", sport: "Basketball", user: "Tom Eriksson", time: "14:00 – 15:30", date: "Tomorrow", avatar: "TE" },
];

const weeklyData = [
  { day: "Mon", bookings: 18 },
  { day: "Tue", bookings: 24 },
  { day: "Wed", bookings: 21 },
  { day: "Thu", bookings: 30 },
  { day: "Fri", bookings: 28 },
  { day: "Sat", bookings: 42 },
  { day: "Sun", bookings: 38 },
];

const revenueData = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 5100 },
  { month: "Mar", revenue: 4800 },
  { month: "Apr", revenue: 6300 },
  { month: "May", revenue: 7100 },
  { month: "Jun", revenue: 6800 },
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Calendar, label: "Bookings", active: false },
  { icon: MapPin, label: "Courts", active: false },
  { icon: Users, label: "Members", active: false },
  { icon: BookOpen, label: "Reports", active: false },
];

const statusConfig = {
  available: { label: "Available", color: "bg-accent text-accent-foreground" },
  occupied: { label: "Occupied", color: "bg-foreground text-primary-foreground" },
  maintenance: { label: "Maintenance", color: "bg-muted text-muted-foreground" },
};

const sportColors: Record<string, string> = {
  Tennis: "bg-emerald-100 text-emerald-800",
  Basketball: "bg-orange-100 text-orange-800",
  Badminton: "bg-blue-100 text-blue-800",
  Squash: "bg-purple-100 text-purple-800",
  Volleyball: "bg-amber-100 text-amber-800",
};

export default function App() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div
      className="flex w-full bg-background"
      style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}
    >
      {/* Sidebar */}
      <aside className="w-56 flex flex-col bg-primary text-primary-foreground shrink-0 min-h-screen sticky top-0 self-start" style={{ minHeight: "100vh" }}>
        {/* Logo */}
        <div className="px-6 pt-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-accent flex items-center justify-center">
              <Activity size={15} className="text-accent-foreground" strokeWidth={2.5} />
            </div>
            <span
              className="text-base font-semibold tracking-tight"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em" }}
            >
              COURTLINE
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5">
          {navItems.map(({ icon: Icon, label }) => {
            const isActive = activeNav === label;
            return (
              <button
                key={label}
                onClick={() => setActiveNav(label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-6 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
            <Settings size={16} strokeWidth={1.8} />
            Settings
          </button>
          <div className="mt-3 mx-3 flex items-center gap-3 border-t border-white/10 pt-4">
            <div className="w-8 h-8 rounded-sm bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
              KN
            </div>
            <div>
              <p className="text-xs font-medium text-white">Kai Nakamura</p>
              <p className="text-[10px] text-white/40">Facility Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1
              className="text-2xl font-bold tracking-wide text-foreground"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              DASHBOARD
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Wednesday, 25 June 2026
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-sm hover:bg-muted transition-colors">
              <Bell size={18} className="text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
            </button>
            <button className="flex items-center gap-2 bg-accent text-accent-foreground text-sm font-medium px-4 py-2 rounded-sm hover:bg-accent/90 transition-colors">
              <Plus size={15} strokeWidth={2.5} />
              New Booking
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 px-8 py-6 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Today's Bookings", value: "24", delta: "+3 from yesterday", icon: Calendar, highlight: false },
              { label: "Courts Active", value: "4/6", delta: "1 in maintenance", icon: MapPin, highlight: false },
              { label: "Members Online", value: "18", delta: "Peak hour soon", icon: Users, highlight: false },
              { label: "Monthly Revenue", value: "$6,800", delta: "+12% vs May", icon: TrendingUp, highlight: true },
            ].map(({ label, value, delta, icon: Icon, highlight }) => (
              <div
                key={label}
                className={`rounded-sm p-5 border ${
                  highlight
                    ? "bg-accent border-accent"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-widest ${highlight ? "text-accent-foreground/60" : "text-muted-foreground"}`}
                      style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px" }}>
                      {label}
                    </p>
                    <p
                      className={`text-3xl font-bold mt-1 ${highlight ? "text-accent-foreground" : "text-foreground"}`}
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-sm ${highlight ? "bg-accent-foreground/10" : "bg-muted"}`}>
                    <Icon size={16} className={highlight ? "text-accent-foreground" : "text-muted-foreground"} />
                  </div>
                </div>
                <p className={`text-xs mt-2 ${highlight ? "text-accent-foreground/70" : "text-muted-foreground"}`}>
                  {delta}
                </p>
              </div>
            ))}
          </div>

          {/* Court availability + chart row */}
          <div className="grid grid-cols-5 gap-4">
            {/* Court grid */}
            <div className="col-span-3 bg-card border border-border rounded-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-sm font-bold uppercase tracking-widest text-foreground"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.12em" }}
                >
                  Court Status
                </h2>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent inline-block" />Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-foreground inline-block" />Occupied</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />Maint.</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {courts.map((court) => {
                  const s = statusConfig[court.status as keyof typeof statusConfig];
                  return (
                    <div
                      key={court.id}
                      className="border border-border rounded-sm p-4 hover:border-foreground/20 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{court.name}</p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm mt-1 inline-block ${sportColors[court.sport]}`}>
                            {court.sport}
                          </span>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-sm ${s.color}`}>
                          {s.label}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-muted-foreground">
                        <Clock size={11} />
                        <span className="text-[11px]" style={{ fontFamily: "'DM Mono', monospace" }}>
                          Next: {court.nextSlot}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly bookings chart */}
            <div className="col-span-2 bg-card border border-border rounded-sm p-5 flex flex-col">
              <h2
                className="text-sm font-bold uppercase tracking-widest text-foreground mb-4"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.12em" }}
              >
                This Week
              </h2>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} barSize={18} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fill: "#5a6b5e" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace", fill: "#5a6b5e" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0e1a12",
                        border: "none",
                        borderRadius: "2px",
                        color: "#f5f5f2",
                        fontSize: "12px",
                        fontFamily: "'DM Mono', monospace",
                      }}
                      cursor={{ fill: "rgba(14,26,18,0.04)" }}
                    />
                    <Bar dataKey="bookings" fill="#b5f040" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom row: bookings + revenue chart */}
          <div className="grid grid-cols-5 gap-4">
            {/* Upcoming bookings */}
            <div className="col-span-3 bg-card border border-border rounded-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-sm font-bold uppercase tracking-widest text-foreground"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.12em" }}
                >
                  Upcoming Bookings
                </h2>
                <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  View all <ChevronRight size={13} />
                </button>
              </div>
              <div className="space-y-1">
                {upcomingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-4 px-3 py-3 rounded-sm hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {b.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{b.user}</p>
                      <p className="text-xs text-muted-foreground">{b.court} · {b.sport}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {b.time}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${b.date === "Today" ? "text-accent-foreground font-semibold" : "text-muted-foreground"}`}
                        style={b.date === "Today" ? { color: "#2d6a4f" } : {}}>
                        {b.date}
                      </p>
                    </div>
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle size={15} className="text-accent" style={{ color: "#b5f040" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue trend */}
            <div className="col-span-2 bg-card border border-border rounded-sm p-5 flex flex-col">
              <div className="flex items-start justify-between mb-1">
                <h2
                  className="text-sm font-bold uppercase tracking-widest text-foreground"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.12em" }}
                >
                  Revenue
                </h2>
                <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  YTD 2026
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                $34,800
              </p>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b5f040" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#b5f040" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace", fill: "#5a6b5e" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace", fill: "#5a6b5e" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0e1a12",
                        border: "none",
                        borderRadius: "2px",
                        color: "#f5f5f2",
                        fontSize: "12px",
                        fontFamily: "'DM Mono', monospace",
                      }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#b5f040"
                      strokeWidth={2}
                      fill="url(#revenueGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
