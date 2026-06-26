import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, CheckCircle2, Layers, TrendingUp, X, Check, RefreshCw, AlertTriangle, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import { BookingCard } from './BookingCard';
import { ConflictGroupCard } from './ConflictGroupCard';

export function DashboardView({
  bookings,
  pendingCount,
  confirmedCount,
  totalSlotsCount,
  totalRevenue,
  isLoading,
  handleConfirm,
  handleReject,
  handleResolveSlotConflict,
  actionLoadingId,
  isDoubleBooked,
  setActiveNav,
  setSelectedAdminCourt
}: any) {
  const [localActiveTab, setLocalActiveTab] = useState<'pending' | 'confirmed'>('pending');
  const localFilteredBookings = bookings.filter((b: any) => b.status === localActiveTab);

  const getMostRecentSunday = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // go back to Sunday
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const [chartBaseDate, setChartBaseDate] = useState<Date>(getMostRecentSunday());

  const handlePrevWeek = () => {
    const newDate = new Date(chartBaseDate);
    newDate.setDate(newDate.getDate() - 7);
    setChartBaseDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(chartBaseDate);
    newDate.setDate(newDate.getDate() + 7);
    setChartBaseDate(newDate);
  };

  const handleGoToToday = () => {
    setChartBaseDate(getMostRecentSunday());
    setShowMonthDropdown(false);
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [dropdownYear, setDropdownYear] = useState(chartBaseDate.getFullYear());
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setShowMonthDropdown(false);
      }
    }
    
    if (showMonthDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthDropdown]);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(dropdownYear, monthIndex, 1);
    newDate.setDate(newDate.getDate() - newDate.getDay());
    setChartBaseDate(newDate);
    setShowMonthDropdown(false);
  };

  // Generate the 7 date strings for the current week view
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(chartBaseDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekDateStrings = weekDates.map(d => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Compute "Activity by Day" across all bookings for the specified week
  const weekActivity = Array.from({ length: 7 }, () => ({ pending: 0, confirmed: 0 })); // Sun - Sat

  bookings.forEach((b: any) => {
    if (b.status === 'rejected') return;
    b.slots?.forEach((s: any) => {
      if (s.status === 'rejected') return;
      if (!s.date) return;
      
      const idx = weekDateStrings.indexOf(s.date);
      if (idx !== -1) {
        if (s.status === 'confirmed') {
          weekActivity[idx].confirmed += 1;
        } else if (s.status === 'pending') {
          weekActivity[idx].pending += 1;
        }
      }
    });
  });

  const maxActivity = Math.max(
    ...weekActivity.map(day => day.pending + day.confirmed),
    1
  );

  const daysLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  const activityData = weekActivity.map((day, i) => {
    const total = day.pending + day.confirmed;
    const dateObj = weekDates[i];
    return {
      day: daysLabels[i],
      dateNum: dateObj.getDate(),
      isCurrentDay: isToday(dateObj),
      total,
      confirmed: day.confirmed,
      pending: day.pending,
      confirmedH: total === 0 ? '0%' : `${(day.confirmed / maxActivity) * 100}%`,
      pendingH: total === 0 ? '0%' : `${(day.pending / maxActivity) * 100}%`,
    }
  });

  const monthYearLabel = chartBaseDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Pending Action", value: pendingCount.toString(), delta: pendingCount > 0 ? "Requires review" : "All caught up", icon: Clock, highlight: pendingCount > 0 },
          { label: "Confirmed Bookings", value: confirmedCount.toString(), delta: "Active in calendar", icon: CheckCircle2, highlight: false },
          { label: "Booked Hours", value: totalSlotsCount.toString(), delta: "Total reserved slots", icon: Layers, highlight: false },
          { label: "Estimated Revenue", value: `₱${totalRevenue.toLocaleString()}`, delta: "Based on confirmed bookings", icon: TrendingUp, highlight: true },
        ].map(({ label, value, delta, icon: Icon, highlight }) => (
          <div
            key={label}
            className={`rounded-2xl p-6 border transition-all ${highlight && label === "Estimated Revenue"
                ? "bg-amber-400 border-amber-400 text-amber-950 shadow-[0_8px_20px_rgba(251,191,36,0.2)]"
                : highlight && label === "Pending Action"
                  ? "bg-white border-amber-300 shadow-sm"
                  : "bg-white border-slate-200 shadow-sm"
              }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${highlight && label === "Estimated Revenue" ? "text-amber-900/70"
                    : highlight && label === "Pending Action" ? "text-amber-600"
                      : "text-slate-500"
                  }`}>
                  {label}
                </p>
                <p className={`text-4xl font-black mt-2 tracking-tight ${highlight && label === "Estimated Revenue" ? "text-amber-950" : "text-slate-900"
                  }`}>
                  {value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${highlight && label === "Estimated Revenue" ? "bg-amber-300/50"
                  : highlight && label === "Pending Action" ? "bg-amber-100/50 text-amber-600"
                    : "bg-slate-100 text-slate-500"
                }`}>
                <Icon size={24} />
              </div>
            </div>
            <p className={`text-xs mt-4 font-semibold ${highlight && label === "Estimated Revenue" ? "text-amber-900/80"
                : highlight && label === "Pending Action" ? "text-amber-700/80"
                  : "text-slate-400"
              }`}>
              {delta}
            </p>
          </div>
        ))}
      </div>

      {/* Charts & Facilities */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Facilities Status */}
        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
              Facilities Status
            </h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                Occupied
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 ml-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Available
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
            {[1, 2, 3, 4, 5, 6].map(courtId => {
              const isOccupied = false;
              return (
                <div
                  key={courtId}
                  onClick={() => {
                    setSelectedAdminCourt(courtId);
                    setActiveNav("Courts");
                  }}
                  className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">Court {courtId}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md mt-1.5 inline-block bg-slate-100 text-slate-600 uppercase tracking-wider">
                        Pickle Ball
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${isOccupied ? "bg-slate-900 text-white" : "bg-emerald-50 text-emerald-700"
                      }`}>
                      {isOccupied ? "Occupied" : "Available"}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span className="text-xs font-semibold">
                        View Schedule
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly bookings chart */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden">
          <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
            <div className="flex flex-col relative" ref={monthPickerRef}>
              <button 
                onClick={() => {
                  setDropdownYear(chartBaseDate.getFullYear());
                  setShowMonthDropdown(!showMonthDropdown);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-100 py-1 px-2 rounded-md -ml-2 w-fit"
              >
                {monthYearLabel}
                <ChevronDown size={14} className={`transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showMonthDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-4">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <button 
                      onClick={() => setDropdownYear(y => y - 1)}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-black text-slate-700">{dropdownYear}</span>
                    <button 
                      onClick={() => setDropdownYear(y => y + 1)}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {monthNames.map((m, idx) => {
                      const isCurrentMonth = chartBaseDate.getMonth() === idx && chartBaseDate.getFullYear() === dropdownYear;
                      return (
                        <button
                          key={m}
                          onClick={() => handleMonthSelect(idx)}
                          className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                            isCurrentMonth 
                              ? 'bg-emerald-500 text-white shadow-sm' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {m}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={handleGoToToday}
                    className="w-full text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 py-2 rounded-lg transition-colors border border-amber-200 hover:border-amber-300"
                  >
                    Go to Today
                  </button>
                </div>
              )}
              
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 mt-1">
                Activity by Day
              </h2>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-400"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirmed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-300"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending</span>
              </div>
            </div>
          </div>
          
          <div className="w-full overflow-x-auto pb-4 -mx-2 px-2 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-4 min-w-[500px] h-56 mt-6">
              <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors shrink-0">
                <ChevronLeft size={20} />
              </button>
            <div className="flex-1 flex items-end gap-3 justify-between pb-2 h-full">
              {activityData.map((stat, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-full h-full relative">
                  <div className="flex-1 flex flex-col justify-end w-full relative">
                    {stat.total > 0 && (
                      <div className="absolute -top-5 left-0 w-full text-center text-[10px] font-black text-slate-700">
                        {stat.total}
                      </div>
                    )}
                    <div className="w-full bg-slate-50 rounded-t-lg relative flex flex-col justify-end h-full overflow-hidden">
                      <div
                        className="w-full bg-slate-300 flex items-center justify-center transition-all overflow-hidden"
                        style={{ height: stat.pendingH }}
                      >
                        {stat.pending > 0 && (stat.pending / maxActivity) * 100 > 8 && (
                          <span className="text-[10px] font-black text-slate-600 mix-blend-color-burn">{stat.pending}</span>
                        )}
                      </div>
                      <div
                        className="w-full bg-amber-400 flex items-center justify-center transition-all overflow-hidden"
                        style={{ height: stat.confirmedH }}
                      >
                        {stat.confirmed > 0 && (stat.confirmed / maxActivity) * 100 > 8 && (
                          <span className="text-[10px] font-black text-amber-900 mix-blend-color-burn">{stat.confirmed}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center mt-1">
                    <span className={`text-[10px] font-bold uppercase leading-none ${stat.isCurrentDay ? 'text-amber-500' : 'text-slate-400'}`}>
                      {stat.day}
                    </span>
                    <span className={`text-xs font-black mt-1 ${stat.isCurrentDay ? 'text-amber-600' : 'text-slate-700'}`}>
                      {stat.dateNum}
                    </span>
                  </div>
                </div>
              ))}
            </div>
              <button onClick={handleNextWeek} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors shrink-0">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: bookings */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
                Manage Bookings
              </h2>
              <button
                onClick={() => setActiveNav("Bookings")}
                className="text-sm font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2"
              >
                View All Bookings
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
              <button
                onClick={() => setLocalActiveTab('pending')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer capitalize ${localActiveTab === 'pending'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <span>Pending</span>
              </button>
              <button
                onClick={() => setLocalActiveTab('confirmed')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer capitalize ${localActiveTab === 'confirmed'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <span>Confirmed</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {isLoading ? (
              <div className="py-10 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
                <p className="font-bold text-sm">Loading...</p>
              </div>
            ) : localFilteredBookings.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-400 font-bold text-sm">No bookings found</p>
              </div>
            ) : (
              (() => {
                const renderedIds = new Set<string>();
                const elements: React.ReactNode[] = [];

                localFilteredBookings.forEach((b: any) => {
                  if (renderedIds.has(b.id)) return;

                  if (b.status === 'pending') {
                    const conflicts = bookings.filter((other: any) => {
                      if (other.id === b.id || other.status !== 'pending') return false;
                      return b.slots?.some((slot: any) =>
                        other.slots?.some((otherSlot: any) =>
                          slot.court === otherSlot.court &&
                          slot.date === otherSlot.date &&
                          slot.timeSlot === otherSlot.timeSlot
                        )
                      );
                    });

                    if (conflicts.length > 0) {
                      const group = [b, ...conflicts];
                      group.forEach(g => renderedIds.add(g.id));
                      elements.push(
                        <ConflictGroupCard
                          key={`conflict-${b.id}`}
                          bookings={group}
                          handleConfirm={handleConfirm}
                          handleReject={handleReject}
                          handleResolveSlotConflict={handleResolveSlotConflict}
                          actionLoadingId={actionLoadingId}
                        />
                      );
                      return;
                    }
                  }

                  renderedIds.add(b.id);
                  elements.push(
                    <BookingCard
                      key={b.id}
                      booking={b}
                      handleConfirm={handleConfirm}
                      handleReject={handleReject}
                      actionLoadingId={actionLoadingId}
                      isDoubleBooked={isDoubleBooked}
                      setActiveNav={setActiveNav}
                    />
                  );
                });

                return elements;
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
