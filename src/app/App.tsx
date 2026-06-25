import React, { useState, useEffect } from 'react';
import { Court } from './components/Court';
import { DashboardView } from './components/dashboard/DashboardView';
import { BookingsView } from './components/dashboard/BookingsView';
import { CourtsView } from './components/dashboard/CourtsView';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  Map as MapIcon, 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  CheckCircle2,
  Layers,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  AlertCircle,
  X,
  Calendar,
  TrendingUp,
  Bell,
  Settings,
  LayoutDashboard,
  BookOpen,
  Plus,
  CheckCircle,
  Activity
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isBefore, startOfDay } from 'date-fns';

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Calendar, label: "Bookings", active: false },
  { icon: MapPin, label: "Courts", active: false },
];

function Dashboard({ goBack }: { goBack: () => void }) {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedBookingId, setFocusedBookingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [selectedAdminCourt, setSelectedAdminCourt] = useState<number | null>(null);
  const [sendOwnerNotifications, setSendOwnerNotifications] = useState(true);
  const [syncGoogleCalendar, setSyncGoogleCalendar] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmVariant?: 'confirm' | 'reject';
  } | null>(null);

  const isDoubleBooked = (booking: any) => {
    if (booking.status !== 'pending') return false;
    return bookings.some(other => {
      if (other.id === booking.id || other.status === 'rejected') return false;
      return booking.slots?.some((slot: any) => 
        other.slots?.some((otherSlot: any) => 
          slot.court === otherSlot.court && 
          slot.date === otherSlot.date && 
          slot.timeSlot === otherSlot.timeSlot
        )
      );
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem('paddle_dashboard_passcode');
    if (saved === 'admin123') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
      fetchSettings();
    }
  }, [isAuthenticated]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        if (data.settings.send_owner_notifications !== undefined) {
          setSendOwnerNotifications(data.settings.send_owner_notifications !== 'false');
        }
        if (data.settings.sync_google_calendar !== undefined) {
          setSyncGoogleCalendar(data.settings.sync_google_calendar !== 'false');
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const handleToggleNotifications = async () => {
    const newValue = !sendOwnerNotifications;
    setSendOwnerNotifications(newValue);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'send_owner_notifications', value: newValue.toString() })
      });
    } catch (err) {
      console.error("Failed to update setting", err);
      setSendOwnerNotifications(!newValue); // revert on failure
    }
  };

  const handleToggleCalendarSync = async () => {
    const newValue = !syncGoogleCalendar;
    setSyncGoogleCalendar(newValue);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'sync_google_calendar', value: newValue.toString() })
      });
    } catch (err) {
      console.error("Failed to update setting", err);
      setSyncGoogleCalendar(!newValue); // revert on failure
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'admin123') {
      localStorage.setItem('paddle_dashboard_passcode', passcode);
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid passcode. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('paddle_dashboard_passcode');
    setIsAuthenticated(false);
    setPasscode('');
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      } else {
        setErrorMessage(data.error || 'Failed to load bookings');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error fetching bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Booking",
      message: "Are you sure you want to confirm this booking? This will schedule the event on Google Calendar and send a confirmation email.",
      confirmText: "Confirm",
      confirmVariant: "confirm",
      onConfirm: async () => {
        setActionLoadingId(id);
        setErrorMessage('');
        try {
          const res = await fetch('/api/bookings/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: id })
          });
          const data = await res.json();
          if (data.success) {
            await fetchBookings();
          } else {
            alert(data.error || 'Failed to confirm booking');
          }
        } catch (err: any) {
          alert(err.message || 'Error confirming booking');
        } finally {
          setActionLoadingId(null);
          setConfirmModal(null);
        }
      }
    });
  };

  const handleReject = async (id: string) => {
    const booking = bookings.find(b => b.id === id);
    const isConfirmed = booking?.status === 'confirmed';
    setConfirmModal({
      isOpen: true,
      title: isConfirmed ? "Cancel Confirmed Booking" : "Reject Booking",
      message: isConfirmed 
        ? "Are you sure you want to cancel this confirmed booking? This will remove the events from Google Calendar and send a cancellation email."
        : "Are you sure you want to reject this booking? This will send a decline notification email.",
      confirmText: isConfirmed ? "Cancel Booking" : "Reject",
      confirmVariant: "reject",
      onConfirm: async () => {
        setActionLoadingId(id);
        setErrorMessage('');
        try {
          const res = await fetch('/api/bookings/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: id })
          });
          const data = await res.json();
          if (data.success) {
            await fetchBookings();
          } else {
            alert(data.error || 'Failed to reject booking');
          }
        } catch (err: any) {
          alert(err.message || 'Error rejecting booking');
        } finally {
          setActionLoadingId(null);
          setConfirmModal(null);
        }
      }
    });
  };

  const handleResolveSlotConflict = async (confirmBookingId: string, court: number, date: string, timeSlot: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Resolve Conflict Slot",
      message: `Are you sure you want to confirm this slot (Court ${court} on ${date} @ ${timeSlot})? This will schedule the slot on Google Calendar and reject other pending requests for this slot.`,
      confirmText: "Confirm Slot",
      confirmVariant: "confirm",
      onConfirm: async () => {
        setActionLoadingId(`${confirmBookingId}-${court}-${date}-${timeSlot}`);
        setErrorMessage('');
        try {
          const res = await fetch('/api/bookings/resolve-slot-conflict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confirmBookingId, court, date, timeSlot })
          });
          const data = await res.json();
          if (data.success) {
            await fetchBookings();
          } else {
            alert(data.error || 'Failed to resolve slot conflict');
          }
        } catch (err: any) {
          alert(err.message || 'Error resolving slot conflict');
        } finally {
          setActionLoadingId(null);
          setConfirmModal(null);
        }
      }
    });
  };

  const handleCancelSlot = async (bookingId: string, court: number, date: string, timeSlot: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancel Slot",
      message: `Are you sure you want to cancel this individual slot (Court ${court} on ${date} @ ${timeSlot})? This will remove it from Google Calendar.`,
      confirmText: "Cancel Slot",
      confirmVariant: "reject",
      onConfirm: async () => {
        setActionLoadingId(`${bookingId}-${court}-${date}-${timeSlot}`);
        setErrorMessage('');
        try {
          const res = await fetch('/api/bookings/cancel-slot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, court, date, timeSlot })
          });
          const data = await res.json();
          if (data.success) {
            await fetchBookings();
          } else {
            alert(data.error || 'Failed to cancel slot');
          }
        } catch (err: any) {
          alert(err.message || 'Error canceling slot');
        } finally {
          setActionLoadingId(null);
          setConfirmModal(null);
        }
      }
    });
  };

  // Stats calculation
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const totalSlotsCount = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.slots?.length || 0), 0);
  const totalRevenue = totalSlotsCount * 500;

  // Filter bookings
  const filteredBookings = bookings.filter(b => {
    if (focusedBookingId && b.id !== focusedBookingId) return false;
    
    const matchesTab = b.status === activeTab;
    if (!matchesTab) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesName = b.name?.toLowerCase().includes(query);
    const matchesEmail = b.email?.toLowerCase().includes(query);
    const matchesPhone = b.phone?.includes(query);
    const matchesSlots = b.slots?.some((s: any) => 
      s.date?.includes(query) || s.timeSlot?.toLowerCase().includes(query) || `court ${s.court}`.includes(query)
    );

    return matchesName || matchesEmail || matchesPhone || matchesSlots;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans text-slate-800 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-400/20 blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-400/10 blur-[130px] pointer-events-none"></div>

        <div className="max-w-md w-full bg-white/85 backdrop-blur-xl border border-slate-200/80 p-8 sm:p-10 rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(15,23,42,0.08)] z-10 text-center">
          <div className="inline-flex bg-gradient-to-tr from-amber-500/10 to-amber-500/20 text-amber-600 p-4.5 rounded-2xl mb-5 border border-amber-500/20 relative shadow-inner">
            <Lock className="w-8 h-8" />
            <div className="absolute inset-0 bg-amber-400/10 rounded-2xl blur-lg animate-pulse pointer-events-none"></div>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-slate-900">Owner Dashboard</h2>
          <p className="text-slate-500 text-sm font-semibold mb-8">Secure access to manage court reservations</p>

          <form onSubmit={handleLogin} className="space-y-5 text-left font-sans">
            <div>
              <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">Passcode</label>
              <input
                type="password"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="Enter admin passcode"
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-slate-800 focus:bg-white rounded-xl font-semibold outline-none transition-all text-slate-800 placeholder-slate-450 focus:ring-1 focus:ring-slate-800"
                autoFocus
              />
            </div>
            {loginError && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-3.5 rounded-xl border border-red-100 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            <button
              type="submit"
              className="w-full py-4 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold tracking-wide shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              Access Dashboard
            </button>
          </form>

          <button
            onClick={goBack}
            className="mt-6 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            ← Back to Booking Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-amber-200 selection:text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-slate-950 text-white shrink-0 min-h-screen sticky top-0 self-start">
        {/* Logo */}
        <div className="px-6 pt-8 pb-6 border-b border-white/10">
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-widest text-white">
              <span className="text-amber-400">THE</span> PADDLE CLUB
            </span>
            <span className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-wider">
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 flex flex-col justify-between">
          <div className="space-y-1">
            {navItems.map(({ icon: Icon, label }) => {
              const isActive = activeNav === label;
              return (
                <button
                  key={label}
                  onClick={() => {
                    if (label === 'Courts') setSelectedAdminCourt(null);
                    setActiveNav(label);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all font-semibold cursor-pointer ${
                    isActive
                      ? "bg-amber-400 text-amber-950 shadow-sm"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/10 pt-6 space-y-3">
            <button 
              onClick={goBack}
              className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-amber-950 text-sm font-bold py-3 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              New Booking
            </button>

            <button 
              onClick={fetchBookings}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2.5 rounded-xl border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Refresh Data
            </button>
          </div>
        </nav>

        {/* Bottom User */}
        <div className="px-4 pb-8 space-y-1">
          {/* Notification Toggle */}
          <div className="px-4 py-4 mb-2 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Email Alerts</span>
              <span className="text-[10px] font-semibold text-white/50">For new bookings</span>
            </div>
            <button 
              onClick={handleToggleNotifications}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${sendOwnerNotifications ? 'bg-amber-400' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${sendOwnerNotifications ? 'translate-x-1.5' : '-translate-x-1.5'}`} />
            </button>
          </div>

          {/* Calendar Sync Toggle */}
          <div className="px-4 py-4 mb-2 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Calendar Auto-Sync</span>
              <span className="text-[10px] font-semibold text-white/50">Push to Google Calendar</span>
            </div>
            <button 
              onClick={handleToggleCalendarSync}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${syncGoogleCalendar ? 'bg-amber-400' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${syncGoogleCalendar ? 'translate-x-1.5' : '-translate-x-1.5'}`} />
            </button>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors font-semibold cursor-pointer"
          >
            <LogOut size={18} strokeWidth={2} />
            Sign Out
          </button>
          
          <div className="mt-4 mx-2 flex items-center gap-3 border-t border-white/10 pt-5">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-white shadow-inner">
              AD
            </div>
            <div>
              <p className="text-sm font-bold text-white">Admin User</p>
              <p className="text-xs font-medium text-white/40">Facility Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Body */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
          {activeNav === 'Dashboard' && (
            <DashboardView
              bookings={bookings}
              pendingCount={pendingCount}
              confirmedCount={confirmedCount}
              totalSlotsCount={totalSlotsCount}
              totalRevenue={totalRevenue}
              isLoading={isLoading}
              handleConfirm={handleConfirm}
              handleReject={handleReject}
              handleResolveSlotConflict={handleResolveSlotConflict}
              handleCancelSlot={handleCancelSlot}
              actionLoadingId={actionLoadingId}
              isDoubleBooked={isDoubleBooked}
              setActiveNav={setActiveNav}
              setSelectedAdminCourt={setSelectedAdminCourt}
            />
          )}

          {activeNav === 'Bookings' && (
            <BookingsView
              bookings={bookings}
              filteredBookings={filteredBookings}
              isLoading={isLoading}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleConfirm={handleConfirm}
              handleReject={handleReject}
              handleResolveSlotConflict={handleResolveSlotConflict}
              handleCancelSlot={handleCancelSlot}
              actionLoadingId={actionLoadingId}
              focusedBookingId={focusedBookingId}
              setFocusedBookingId={setFocusedBookingId}
            />
          )}

          {activeNav === 'Courts' && (
            <CourtsView
              bookings={bookings}
              selectedAdminCourt={selectedAdminCourt}
              setSelectedAdminCourt={setSelectedAdminCourt}
              setActiveNav={setActiveNav}
              setSearchQuery={setSearchQuery}
              setActiveTab={setActiveTab}
              setFocusedBookingId={setFocusedBookingId}
              handleConfirm={handleConfirm}
              handleReject={handleReject}
              actionLoadingId={actionLoadingId}
            />
          )}
        </div>
      </main>

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div 
          onClick={() => setConfirmModal(null)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">
                {confirmModal.title}
              </h3>
              <button 
                onClick={() => setConfirmModal(null)} 
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer ${
                  confirmModal.confirmVariant === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function App() {
  const [isDashboard, setIsDashboard] = useState(window.location.pathname === '/dashboard');

  useEffect(() => {
    const handlePopState = () => {
      setIsDashboard(window.location.pathname === '/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isDashboard) {
    return <Dashboard goBack={() => { window.history.pushState({}, '', '/'); setIsDashboard(false); }} />;
  }
  const [selectedCourts, setSelectedCourts] = useState<number[]>([]);
  const [schedulingMode, setSchedulingMode] = useState<'batch' | 'individual' | null>(null);
  
  // Booking Flow Steps: 'selection' | 'scheduling-type' | 'scheduling' | 'form' | 'success'
  const [bookingStep, setBookingStep] = useState<'selection' | 'scheduling-type' | 'scheduling' | 'form' | 'success'>('selection');

  // courtConfigs: stores date & times per court.
  // Record<number, { date: Date | null, times: string[], currentMonth: Date }>
  const [courtConfigs, setCourtConfigs] = useState<Record<number, { date: Date | null, times: string[], currentMonth: Date }>>({});
  
  const [activeIndividualCourt, setActiveIndividualCourt] = useState<number | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  // Blocked slots state
  const [blockedSlots, setBlockedSlots] = useState<{ court: number, time_slot: string, date: string }[]>([]);

  // Fetch availability when selected dates change
  useEffect(() => {
    const activeDates = Object.values(courtConfigs)
      .map(c => c.date ? format(c.date, 'yyyy-MM-dd') : null)
      .filter((d): d is string => d !== null);

    if (activeDates.length === 0) return;

    const fetchAvailability = async (dateStr: string) => {
      try {
        const res = await fetch(`/api/availability?date=${dateStr}`);
        const data = await res.json();
        if (data.success) {
          setBlockedSlots(prev => {
            const filtered = prev.filter(s => s.date !== dateStr);
            return [...filtered, ...data.reservedSlots.map((s: any) => ({ ...s, date: dateStr }))];
          });
        }
      } catch (err) {
        console.error("Failed to fetch availability:", err);
      }
    };

    const uniqueDates = Array.from(new Set(activeDates));
    uniqueDates.forEach(d => {
      fetchAvailability(d);
    });
  }, [courtConfigs]);

  const times = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', 
    '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', 
    '09:00 PM', '10:00 PM'
  ];

  const handleCourtSelect = (num: number) => {
    setSelectedCourts(prev => {
      const next = prev.includes(num) ? prev.filter(c => c !== num) : [...prev, num];
      
      setCourtConfigs(prevConfigs => {
        const updated = { ...prevConfigs };
        // Add new courts
        next.forEach(c => {
          if (!updated[c]) {
            updated[c] = { date: null, times: [], currentMonth: startOfMonth(new Date()) };
          }
        });
        // Remove deselected courts
        Object.keys(updated).forEach(k => {
          if (!next.includes(Number(k))) {
            delete updated[Number(k)];
          }
        });
        return updated;
      });

      if (next.length === 0) {
        setSchedulingMode(null);
        setActiveIndividualCourt(null);
      }
      return next;
    });
    setBookingStep('selection');
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setErrors({});
  };

  const handleNextMonth = (courtId: number) => {
    setCourtConfigs(prev => ({
      ...prev,
      [courtId]: {
        ...prev[courtId],
        currentMonth: addMonths(prev[courtId].currentMonth, 1)
      }
    }));
  };

  const handlePrevMonth = (courtId: number) => {
    setCourtConfigs(prev => ({
      ...prev,
      [courtId]: {
        ...prev[courtId],
        currentMonth: subMonths(prev[courtId].currentMonth, 1)
      }
    }));
  };

  const handleBatchNextMonth = () => {
    setCourtConfigs(prev => {
      const updated = { ...prev };
      selectedCourts.forEach(c => {
        updated[c] = {
          ...updated[c],
          currentMonth: addMonths(updated[c].currentMonth, 1)
        };
      });
      return updated;
    });
  };

  const handleBatchPrevMonth = () => {
    setCourtConfigs(prev => {
      const updated = { ...prev };
      selectedCourts.forEach(c => {
        updated[c] = {
          ...updated[c],
          currentMonth: subMonths(updated[c].currentMonth, 1)
        };
      });
      return updated;
    });
  };

  const getCalendarDays = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const today = startOfDay(new Date());

  // Form Validation
  const validateForm = () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email.trim() && !emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      newErrors.phone = 'Contact number is required';
    } else if (cleanedPhone.length !== 11) {
      newErrors.phone = 'Contact number must be exactly 11 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const totalBookingsCount = Object.values(courtConfigs).reduce(
    (acc, val) => acc + (val.times?.length || 0),
    0
  );
  const totalAmount = totalBookingsCount * 500;

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const bookings = selectedCourts.map(c => {
      const config = courtConfigs[c] || { date: new Date(), times: [] };
      return {
        court: c,
        date: format(config.date || new Date(), 'yyyy-MM-dd'),
        times: config.times || []
      };
    });

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookings,
          name,
          email,
          phone,
          message
        })
      });

      const responseText = await response.text();
      let resData: any = {};
      try {
        resData = JSON.parse(responseText);
      } catch (e) {
        resData = { error: responseText || 'An unexpected error occurred.' };
      }

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to submit booking');
      }

      setBookingStep('success');
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred during booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAll = () => {
    setSelectedCourts([]);
    setSchedulingMode(null);
    setBookingStep('selection');
    setCourtConfigs({});
    setActiveIndividualCourt(null);
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-slate-900 selection:bg-amber-200">
      <div className="max-w-[1400px] w-full flex flex-col xl:flex-row gap-8">

        {/* Left Side: Layout Map */}
        <div className="flex-1 bg-[#d8dde3] p-4 sm:p-6 md:p-8 rounded-[2rem] shadow-2xl border-8 border-slate-300 relative overflow-hidden flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-8 md:px-12 py-3 rounded-b-2xl font-black tracking-widest text-xl md:text-2xl shadow-xl z-20 flex items-center gap-3">
            <span className="text-amber-400">THE</span> PADDLE CLUB
          </div>

          {/* Decorative floor lines */}
          <div className="absolute inset-0 pointer-events-none opacity-20" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #94a3b8 1px, transparent 0)', backgroundSize: '24px 24px' }}>
          </div>

          {/* Main Layout Container */}
          <div className="flex flex-col h-full min-h-[380px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[800px] z-10 pt-16 md:pt-20 pb-4">
            
            {/* Layout Grid */}
            <div className="flex-1 flex flex-row gap-2 sm:gap-4 md:gap-6 lg:gap-8">
              
              {/* Left Column - Facilities */}
              <div className="w-[25%] flex flex-col gap-2 sm:gap-4 md:gap-6">
                <div className="flex-1 min-h-[40px] sm:min-h-[80px] bg-white/80 backdrop-blur border-2 sm:border-4 border-slate-300 rounded-lg sm:rounded-2xl flex items-center justify-center font-black text-slate-600 text-[9px] sm:text-base lg:text-lg tracking-widest shadow-sm hover:bg-white transition-colors">
                  <div className="flex flex-col items-center gap-0.5 sm:gap-2">
                    <Users className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-slate-400" />
                    <span className="hidden xs:inline">REST ROOMS</span>
                    <span className="xs:hidden">REST</span>
                  </div>
                </div>
                <div className="flex-1 min-h-[40px] sm:min-h-[80px] bg-white/80 backdrop-blur border-2 sm:border-4 border-slate-300 rounded-lg sm:rounded-2xl flex items-center justify-center font-black text-slate-600 text-[9px] sm:text-base lg:text-lg tracking-widest shadow-sm hover:bg-white transition-colors">
                  <div className="flex flex-col items-center gap-0.5 sm:gap-2">
                    <MapIcon className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-slate-400" />
                    <span>CAFE</span>
                  </div>
                </div>
                <div className="flex-1 min-h-[40px] sm:min-h-[80px] bg-white/80 backdrop-blur border-2 sm:border-4 border-slate-300 rounded-t-lg sm:rounded-t-2xl border-b-0 flex items-end justify-center pb-2 sm:pb-8 font-black text-slate-600 text-[9px] sm:text-base lg:text-lg tracking-widest shadow-sm hover:bg-white transition-colors relative overflow-hidden">
                  <div className="absolute bottom-0 w-full h-1 sm:h-2 bg-amber-400"></div>
                  <span>ENTRY</span>
                </div>
              </div>

              {/* Walkway divider */}
              <div className="flex w-2 sm:w-4 bg-slate-300/50 rounded-full mx-0.5 sm:mx-2"></div>

              {/* Middle Column - Courts 1,2,3 */}
              <div className="w-[35%] flex flex-col gap-2 sm:gap-4 md:gap-6">
                 {[1, 2, 3].map(num => (
                   <Court
                     key={num}
                     number={num}
                     selected={selectedCourts.includes(num)}
                     onClick={() => handleCourtSelect(num)}
                   />
                 ))}
              </div>

              {/* Right Column - Courts 4,5,6 */}
              <div className="w-[35%] flex flex-col gap-2 sm:gap-4 md:gap-6">
                 {[4, 5, 6].map(num => (
                   <Court
                     key={num}
                     number={num}
                     selected={selectedCourts.includes(num)}
                     onClick={() => handleCourtSelect(num)}
                   />
                 ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Booking Panel */}
        <div className="w-full xl:w-[420px] bg-white rounded-[2rem] shadow-xl p-6 md:p-8 border border-slate-200 flex flex-col shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Reservation</h2>
          </div>
          <p className="text-slate-500 mb-8 font-medium">Select a court from the layout to check availability and book.</p>

          {selectedCourts.length > 0 ? (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
              
              {/* Selected Court Details */}
              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 mb-8 flex items-center gap-4 relative overflow-hidden group hover:border-amber-200 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-amber-400 text-amber-950 w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-400/30 shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-black text-xl text-slate-800 tracking-tight">
                      {selectedCourts.length > 1 ? `Courts: ${selectedCourts.sort().join(', ')}` : `Court ${selectedCourts[0]}`}
                    </div>
                    <div className="text-sm font-medium text-slate-500 mt-0.5">
                      Indoor Standard
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 1: Main Court selection view & proceed action */}
              {bookingStep === 'selection' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5 text-sm font-semibold text-slate-600 space-y-3">
                    <div className="flex justify-between">
                      <span>Total Selected Courts:</span>
                      <span className="text-slate-900 font-bold">{selectedCourts.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Hourly Rate:</span>
                      <span className="text-slate-900 font-bold">₱{(selectedCourts.length * 500).toLocaleString()}/hr</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t-2 border-slate-100">
                    <button 
                      onClick={() => {
                        if (selectedCourts.length > 1) {
                          setBookingStep('scheduling-type');
                        } else {
                          setSchedulingMode('batch');
                          // Create baseline configs
                          setCourtConfigs(prev => {
                            const updated = { ...prev };
                            selectedCourts.forEach(c => {
                              updated[c] = { date: null, times: [], currentMonth: startOfMonth(new Date()) };
                            });
                            return updated;
                          });
                          setBookingStep('scheduling');
                        }
                      }}
                      className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-800/20 active:scale-[0.98]"
                    >
                      <span>Proceed to Schedule</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 1.5: Select Reservation Type (Batch vs Individual) */}
              {bookingStep === 'scheduling-type' && (
                <div className="flex-1 flex flex-col space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <button 
                      type="button"
                      onClick={() => setBookingStep('selection')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-bold text-slate-800 text-lg">Select Reservation Type</h3>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        setSchedulingMode('batch');
                        // Copy baseline batch month config to all courts
                        setCourtConfigs(prev => {
                          const updated = { ...prev };
                          selectedCourts.forEach(c => {
                            updated[c] = { date: null, times: [], currentMonth: startOfMonth(new Date()) };
                          });
                          return updated;
                        });
                        setBookingStep('scheduling');
                      }}
                      className="w-full p-5 rounded-2xl border-2 border-slate-100 hover:border-amber-400 bg-white hover:bg-amber-50/30 transition-all text-left flex items-start gap-4 shadow-sm group"
                    >
                      <div className="bg-amber-100 text-amber-700 p-3 rounded-xl shrink-0 group-hover:bg-amber-200">
                        <Layers className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-lg group-hover:text-amber-900">Batch Reservation</h4>
                        <p className="text-sm font-semibold text-slate-400 mt-1 leading-snug">Apply the same Date & Timeslot configuration across all selected courts.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSchedulingMode('individual');
                        setActiveIndividualCourt(null);
                        setBookingStep('scheduling');
                      }}
                      className="w-full p-5 rounded-2xl border-2 border-slate-100 hover:border-amber-400 bg-white hover:bg-amber-50/30 transition-all text-left flex items-start gap-4 shadow-sm group"
                    >
                      <div className="bg-amber-100 text-amber-700 p-3 rounded-xl shrink-0 group-hover:bg-amber-200">
                        <CalendarDays className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-lg group-hover:text-amber-900">Individual Reservation</h4>
                        <p className="text-sm font-semibold text-slate-400 mt-1 leading-snug">Configure a unique Date & Timeslot selection for each selected court separately.</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Scheduling Configuration */}
              {bookingStep === 'scheduling' && (
                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* BATCH MODE SCHEDULING */}
                  {schedulingMode === 'batch' && (
                    (() => {
                      const refCourt = selectedCourts[0];
                      const config = courtConfigs[refCourt] || { date: null, times: [], currentMonth: new Date() };
                      const calendarDays = getCalendarDays(config.currentMonth);

                      return (
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <button 
                                type="button"
                                onClick={() => {
                                  if (selectedCourts.length > 1) {
                                    setBookingStep('scheduling-type');
                                  } else {
                                    setBookingStep('selection');
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                              >
                                <ArrowLeft className="w-5 h-5" />
                              </button>
                              <h3 className="font-bold text-slate-800 text-lg">Batch Schedule Setup</h3>
                            </div>

                            {!config.date ? (
                              <div className="space-y-4 animate-in fade-in">
                                <h3 className="font-bold text-slate-600 flex items-center gap-2">
                                  <CalendarDays className="w-5 h-5 text-slate-400" /> Select a Date
                                </h3>
                                <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
                                  <div className="flex items-center justify-between mb-4">
                                    <button 
                                      onClick={handleBatchPrevMonth}
                                      disabled={isBefore(config.currentMonth, startOfMonth(today))}
                                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors"
                                    >
                                      <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <h4 className="font-black text-slate-800 text-lg">
                                      {format(config.currentMonth, 'MMMM yyyy')}
                                    </h4>
                                    <button 
                                      onClick={handleBatchNextMonth}
                                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                                    >
                                      <ChevronRight className="w-5 h-5" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                      <div key={day} className="text-center text-xs font-bold text-slate-400 py-1">{day}</div>
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map((date, i) => {
                                      const isPast = isBefore(date, today);
                                      const isCurrentMonth = isSameMonth(date, config.currentMonth);
                                      const isToday = isSameDay(date, today);
                                      return (
                                        <button 
                                          key={i}
                                          disabled={isPast}
                                          onClick={() => {
                                            setCourtConfigs(prev => {
                                              const next = { ...prev };
                                              selectedCourts.forEach(c => {
                                                const current = next[c] || { date: null, times: [], currentMonth: startOfMonth(new Date()) };
                                                next[c] = { ...current, date: date };
                                              });
                                              return next;
                                            });
                                          }}
                                          className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all
                                            ${!isCurrentMonth ? 'text-slate-300' : ''}
                                            ${isPast ? 'opacity-40 cursor-not-allowed text-slate-400' : 'hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 cursor-pointer border-2 border-transparent'}
                                            ${isToday && !isPast ? 'bg-slate-800 text-white hover:bg-slate-700' : ''}
                                            ${isCurrentMonth && !isPast && !isToday ? 'bg-slate-50 text-slate-700' : ''}`}
                                        >
                                          {format(date, 'd')}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4 animate-in fade-in">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-slate-400" /> Available Times
                                  </h3>
                                  <button 
                                    onClick={() => {
                                      setCourtConfigs(prev => {
                                        const next = { ...prev };
                                        selectedCourts.forEach(c => {
                                          next[c] = { ...next[c], date: null, times: [] };
                                        });
                                        return next;
                                      });
                                    }}
                                    className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    {format(config.date, 'MMM d, yyyy')} • Change
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  {times.map((time, i) => {
                                    const isSelected = config.times.includes(time);
                                    const dateStr = format(config.date!, 'yyyy-MM-dd');
                                    const isBlocked = selectedCourts.some(c => 
                                      blockedSlots.some(s => s.court === c && s.date === dateStr && s.time_slot === time)
                                    );
                                    return (
                                      <button 
                                        key={i}
                                        disabled={isBlocked}
                                        onClick={() => {
                                          setCourtConfigs(prev => {
                                            const next = { ...prev };
                                            selectedCourts.forEach(c => {
                                              const current = next[c] || { date: null, times: [], currentMonth: startOfMonth(new Date()) };
                                              const currentTimes = current.times || [];
                                              const newTimes = currentTimes.includes(time)
                                                ? currentTimes.filter(t => t !== time)
                                                : [...currentTimes, time];
                                              next[c] = { ...current, times: newTimes };
                                            });
                                            return next;
                                          });
                                        }}
                                        className={`py-3 px-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                                          isBlocked
                                            ? 'border-transparent bg-slate-100 text-slate-300 line-through cursor-not-allowed'
                                            : isSelected
                                              ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm cursor-pointer'
                                              : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50 cursor-pointer'
                                        }`}
                                      >
                                        {time}
                                        {isSelected && <Check className="w-4 h-4" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-8 pt-6 border-t-2 border-slate-100">
                            <button 
                              disabled={!config.date || config.times.length === 0}
                              onClick={() => setBookingStep('form')}
                              className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                                config.date && config.times.length > 0
                                  ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-xl shadow-slate-800/20 active:scale-[0.98]' 
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <span>Proceed to Details</span>
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {/* INDIVIDUAL MODE SCHEDULING */}
                  {schedulingMode === 'individual' && (
                    <div className="flex-1 flex flex-col justify-between">
                      {activeIndividualCourt === null ? (
                        /* List of selected courts to configure */
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                              <button 
                                type="button"
                                onClick={() => setBookingStep('scheduling-type')}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                              >
                                <ArrowLeft className="w-5 h-5" />
                              </button>
                              <h3 className="font-bold text-slate-800 text-lg">Configure Courts Separately</h3>
                            </div>

                            <div className="space-y-3">
                              {selectedCourts.sort().map(c => {
                                const config = courtConfigs[c] || { date: null, times: [], currentMonth: new Date() };
                                const isConfigured = config.date !== null && config.times.length > 0;

                                return (
                                  <button
                                    key={c}
                                    onClick={() => setActiveIndividualCourt(c)}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between group ${
                                      isConfigured 
                                        ? 'border-emerald-100 bg-emerald-50/20 hover:border-emerald-400' 
                                        : 'border-slate-100 hover:border-amber-400 bg-white'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                        isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-800'
                                      }`}>
                                        {c}
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-slate-800">Court {c}</h4>
                                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                                          {isConfigured 
                                            ? `${format(config.date!, 'MMM d')} • ${config.times.length} timeslots`
                                            : 'Requires configuration'}
                                        </p>
                                      </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t-2 border-slate-100">
                            <button 
                              disabled={!selectedCourts.every(c => courtConfigs[c]?.date !== null && courtConfigs[c]?.times.length > 0)}
                              onClick={() => setBookingStep('form')}
                              className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                                selectedCourts.every(c => courtConfigs[c]?.date !== null && courtConfigs[c]?.times.length > 0)
                                  ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-xl shadow-slate-800/20 active:scale-[0.98]' 
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <span>Proceed to Details</span>
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Date and time configuration for a specific court */
                        (() => {
                          const c = activeIndividualCourt;
                          const config = courtConfigs[c];
                          const calendarDays = getCalendarDays(config.currentMonth);

                          return (
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <button 
                                    type="button"
                                    onClick={() => setActiveIndividualCourt(null)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                                  >
                                    <ArrowLeft className="w-5 h-5" />
                                  </button>
                                  <h3 className="font-bold text-slate-800 text-lg">Configure Court {c}</h3>
                                </div>

                                {!config.date ? (
                                  <div className="space-y-4 animate-in fade-in">
                                    <h3 className="font-bold text-slate-600 flex items-center gap-2">
                                      <CalendarDays className="w-5 h-5 text-slate-400" /> Select a Date
                                    </h3>
                                    <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
                                      <div className="flex items-center justify-between mb-4">
                                        <button 
                                          onClick={() => handlePrevMonth(c)}
                                          disabled={isBefore(config.currentMonth, startOfMonth(today))}
                                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors"
                                        >
                                          <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <h4 className="font-black text-slate-800 text-lg">
                                          {format(config.currentMonth, 'MMMM yyyy')}
                                        </h4>
                                        <button 
                                          onClick={() => handleNextMonth(c)}
                                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                                        >
                                          <ChevronRight className="w-5 h-5" />
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                          <div key={day} className="text-center text-xs font-bold text-slate-400 py-1">{day}</div>
                                        ))}
                                      </div>
                                      <div className="grid grid-cols-7 gap-1">
                                        {calendarDays.map((date, i) => {
                                          const isPast = isBefore(date, today);
                                          const isCurrentMonth = isSameMonth(date, config.currentMonth);
                                          const isToday = isSameDay(date, today);
                                          return (
                                            <button 
                                              key={i}
                                              disabled={isPast}
                                              onClick={() => {
                                                setCourtConfigs(prev => {
                                                  const current = prev[c] || { date: null, times: [], currentMonth: startOfMonth(new Date()) };
                                                  return {
                                                    ...prev,
                                                    [c]: { ...current, date: date }
                                                  };
                                                });
                                              }}
                                              className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all
                                                ${!isCurrentMonth ? 'text-slate-300' : ''}
                                                ${isPast ? 'opacity-40 cursor-not-allowed text-slate-400' : 'hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 cursor-pointer border-2 border-transparent'}
                                                ${isToday && !isPast ? 'bg-slate-800 text-white hover:bg-slate-700' : ''}
                                                ${isCurrentMonth && !isPast && !isToday ? 'bg-slate-50 text-slate-700' : ''}`}
                                            >
                                              {format(date, 'd')}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-4 animate-in fade-in">
                                    <div className="flex items-center justify-between mb-4">
                                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-slate-400" /> Available Times
                                      </h3>
                                      <button 
                                        onClick={() => {
                                          setCourtConfigs(prev => {
                                            const current = prev[c] || { date: null, times: [], currentMonth: startOfMonth(new Date()) };
                                            return {
                                              ...prev,
                                              [c]: { ...current, date: null, times: [] }
                                            };
                                          });
                                        }}
                                        className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                                      >
                                        {format(config.date, 'MMM d, yyyy')} • Change
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      {times.map((time, i) => {
                                        const isSelected = config.times.includes(time);
                                        const dateStr = format(config.date!, 'yyyy-MM-dd');
                                        const isBlocked = blockedSlots.some(s => s.court === c && s.date === dateStr && s.time_slot === time);
                                        return (
                                          <button 
                                            key={i}
                                            disabled={isBlocked}
                                            onClick={() => {
                                              setCourtConfigs(prev => {
                                                const current = prev[c] || { date: null, times: [], currentMonth: startOfMonth(new Date()) };
                                                const currentTimes = current.times || [];
                                                const newTimes = currentTimes.includes(time)
                                                  ? currentTimes.filter(t => t !== time)
                                                  : [...currentTimes, time];
                                                return {
                                                  ...prev,
                                                  [c]: { ...current, times: newTimes }
                                                };
                                              });
                                            }}
                                            className={`py-3 px-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                                              isBlocked
                                                ? 'border-transparent bg-slate-100 text-slate-300 line-through cursor-not-allowed'
                                                : isSelected
                                                  ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm cursor-pointer'
                                                  : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50 cursor-pointer'
                                            }`}
                                          >
                                            {time}
                                            {isSelected && <Check className="w-4 h-4" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="mt-8 pt-6 border-t-2 border-slate-100">
                                <button 
                                  onClick={() => setActiveIndividualCourt(null)}
                                  className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-800/20 active:scale-[0.98]"
                                >
                                  <span>Save & Return</span>
                                </button>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Customer Details Form */}
              {bookingStep === 'form' && (
                <form onSubmit={handleConfirmBooking} className="flex-1 flex flex-col space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <button 
                      type="button"
                      onClick={() => setBookingStep('scheduling')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-bold text-slate-800 text-lg">Enter Details</h3>
                  </div>

                  {/* Summary of choice */}
                  <div className="text-sm font-medium text-slate-600 bg-amber-50 border border-amber-200/50 rounded-xl p-4 mb-2 flex flex-col gap-2 max-h-[180px] overflow-y-auto">
                    <div className="font-black text-xs text-amber-950 uppercase tracking-wider border-b border-amber-200/50 pb-1">Booking Summary:</div>
                    {selectedCourts.sort().map(c => {
                      const config = courtConfigs[c] || { date: null, times: [] };
                      return (
                        <div key={c} className="text-xs leading-snug border-b border-amber-100/50 pb-1.5 last:border-0 last:pb-0">
                          <span className="font-bold text-amber-950">Court {c}:</span>{' '}
                          {config.date ? format(config.date, 'MMMM d, yyyy') : ''} @{' '}
                          {config.times.sort().join(', ')}
                        </div>
                      );
                    })}
                    <div className="border-t border-amber-200/50 pt-2 flex justify-between font-black text-sm text-amber-950">
                      <span>Total Amount Due:</span>
                      <span>₱{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
                    </label>
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-slate-50 focus:bg-white transition-all font-semibold outline-none text-slate-800 ${
                        errors.name ? 'border-red-400 focus:border-red-500' : 'border-slate-100 focus:border-amber-400'
                      }`}
                    />
                    {errors.name && <p className="text-xs font-bold text-red-500">{errors.name}</p>}
                  </div>

                  {/* Contact Number Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> Contact Number
                      </label>
                      <span className="text-[10px] font-semibold text-amber-600">Required</span>
                    </div>
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 11) {
                          setPhone(val);
                        }
                      }}
                      placeholder="09171234567"
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-slate-50 focus:bg-white transition-all font-semibold outline-none text-slate-800 ${
                        errors.phone ? 'border-red-400 focus:border-red-500' : 'border-slate-100 focus:border-amber-400'
                      }`}
                    />
                    {errors.phone && <p className="text-xs font-bold text-red-500">{errors.phone}</p>}
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">Optional</span>
                    </div>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="johndoe@example.com"
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-slate-50 focus:bg-white transition-all font-semibold outline-none text-slate-800 ${
                        errors.email ? 'border-red-400 focus:border-red-500' : 'border-slate-100 focus:border-amber-400'
                      }`}
                    />
                    {errors.email && <p className="text-xs font-bold text-red-500">{errors.email}</p>}
                  </div>

                  {/* Message/Notes textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Message (Optional)
                    </label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Any request or notes..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-amber-400 transition-all font-semibold outline-none text-slate-800 resize-none"
                    />
                  </div>

                  {/* Error feedback */}
                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-semibold text-xs text-center animate-in fade-in">
                      {submitError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-800/20 active:scale-[0.98] mt-4 ${
                      isSubmitting 
                        ? 'bg-slate-500 cursor-not-allowed text-slate-200' 
                        : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Booking</span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 4: Success Screen */}
              {bookingStep === 'success' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-500 ease-out fill-mode-both">
                  <div className="bg-amber-100 text-amber-600 p-4 rounded-full shadow-lg shadow-amber-200">
                    <Clock className="w-16 h-16" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">Awaiting Confirmation</h3>
                    <p className="text-slate-500 font-medium text-xs mt-1">Your reservation request has been submitted. You will receive a notification once confirmed or rejected.</p>
                  </div>

                  <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-left text-sm space-y-3 font-semibold text-slate-700 max-h-[220px] overflow-y-auto">
                    <div className="font-bold text-xs text-slate-400 uppercase tracking-wider border-b pb-1">Reserved Sessions:</div>
                    {selectedCourts.sort().map(c => {
                      const config = courtConfigs[c] || { date: null, times: [] };
                      return (
                        <div key={c} className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                          <span className="text-slate-500 font-bold">Court {c}</span>
                          <span className="text-slate-800 font-bold truncate max-w-[240px]">
                            {config.date ? format(config.date, 'MMM d') : ''} @ {config.times.sort().join(', ')}
                          </span>
                        </div>
                      );
                    })}
                    
                    <div className="border-t border-slate-200 pt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Reserved For</span>
                        <span className="text-slate-800 font-bold">{name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email</span>
                        <span className="text-slate-800 font-bold truncate max-w-[180px]">{email}</span>
                      </div>
                      <div className="flex justify-between font-black text-sm text-slate-800 pt-1 border-t border-dashed border-slate-200">
                        <span>Amount Due</span>
                        <span className="text-emerald-600">₱{totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={resetAll}
                    className="w-full py-4 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all active:scale-[0.98]"
                  >
                    Book Another Session
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 space-y-4 p-8 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
              <MapIcon className="w-16 h-16 text-slate-300" strokeWidth={1.5} />
              <p className="text-lg font-medium text-slate-500">Click on any court on the map to view schedule and book.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
