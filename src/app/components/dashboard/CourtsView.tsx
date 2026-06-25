import React, { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Calendar } from '../ui/calendar';

export function CourtsView({ bookings, selectedAdminCourt, setSelectedAdminCourt, setActiveNav, setSearchQuery, setActiveTab, setFocusedBookingId, handleConfirm, handleReject, actionLoadingId }: any) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [selectedConflicts, setSelectedConflicts] = useState<any[] | null>(null);

  const timeSlots = [
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', 
    '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'
  ];
  const courts = [1, 2, 3, 4, 5, 6];

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Compute status and booking for a specific court and slot on selectedDate
  const getSlotData = (court: number, time: string) => {
    let conflictingBookings: any[] = [];
    for (const b of bookings) {
      if (b.status === 'rejected') continue;
      const hasSlot = b.slots?.some((s: any) => 
        String(s.court) === String(court) && 
        s.date === dateStr && 
        s.timeSlot === time && 
        s.status !== 'rejected'
      );
      if (hasSlot) {
        conflictingBookings.push(b);
      }
    }
    
    if (conflictingBookings.length === 0) return { status: 'available', booking: null, conflicts: null };
    if (conflictingBookings.length === 1) {
      return { status: conflictingBookings[0].status, booking: conflictingBookings[0], conflicts: null };
    }
    return { status: 'conflict', booking: null, conflicts: conflictingBookings };
  };

  const visibleCourts = selectedAdminCourt ? [selectedAdminCourt] : courts;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[calc(100vh-4rem)]">
      {/* Header - Persistent */}
      <div className="shrink-0 p-6 pb-4 border-b border-slate-200 shadow-sm z-20 bg-white rounded-t-2xl">
        <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
              {selectedAdminCourt ? `Court ${selectedAdminCourt} Schedule` : 'All Courts Schedule'}
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">
              View available, pending, and confirmed time slots.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-6">
            {/* Legend beside the date picker */}
            <div className="hidden lg:flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-50 border border-emerald-200"></span>Avail
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300"></span>Pend
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-900"></span>Conf
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-100 border border-rose-300"></span>Conflict
              </span>
            </div>

            {selectedAdminCourt && (
              <button
                onClick={() => setSelectedAdminCourt(null)}
                className="text-sm font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2"
              >
                View All Courts
              </button>
            )}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shrink-0">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDate(subDays(selectedDate, 1));
                }}
                className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-slate-900 shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="relative px-6 py-2 flex items-center gap-2 font-bold text-sm text-slate-800 min-w-[160px] justify-center hover:bg-white rounded-lg transition-colors cursor-pointer shadow-sm border border-transparent"
                  >
                    <CalendarIcon size={15} className="text-slate-500" />
                    <span>{format(selectedDate, 'MMM d, yyyy')}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[110]" align="center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDate(addDays(selectedDate, 1));
                }}
                className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-slate-900 shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-auto p-6 pt-0 relative">
        <div className="min-w-[800px] pb-4">
          <div className="grid" style={{ gridTemplateColumns: `80px repeat(${visibleCourts.length}, minmax(0, 1fr))` }}>
            {/* Header (Sticky inside scrollable area) */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm p-3 pt-6 text-xs font-black text-slate-400 text-right uppercase border-b border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              Time
            </div>
            {visibleCourts.map(c => (
              <div key={c} className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm p-3 pt-6 text-center font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 border-l border-slate-50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                Court {c}
              </div>
            ))}

            {/* Rows */}
            {timeSlots.map(time => (
              <React.Fragment key={time}>
                <div className="p-3 text-xs font-bold text-slate-400 text-right border-b border-slate-50 flex items-center justify-end">
                  {time}
                </div>
                {visibleCourts.map(c => {
                  const { status, booking, conflicts } = getSlotData(c, time);
                  return (
                    <div key={`${c}-${time}`} className="p-1.5 border-b border-l border-slate-50">
                      <div 
                        onClick={() => {
                          if (conflicts) setSelectedConflicts(conflicts);
                          else if (booking) setSelectedBooking(booking);
                        }}
                        className={`w-full h-full min-h-[36px] rounded-lg border transition-all flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${
                        status === 'available' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600/0 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer'
                        : status === 'pending' ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-sm cursor-pointer hover:bg-amber-200'
                        : status === 'confirmed' ? 'bg-slate-900 border-slate-900 text-white shadow-sm cursor-pointer hover:bg-slate-800'
                        : 'bg-rose-100 border-rose-300 text-rose-700 shadow-sm cursor-pointer hover:bg-rose-200 animate-pulse'
                      }`}>
                        {status === 'available' ? 'Avail' : status}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div 
          onClick={() => setSelectedBooking(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Booking Details</h3>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                <p className="font-bold text-slate-800">{selectedBooking.name}</p>
                <p className="text-sm font-semibold text-slate-600">{selectedBooking.phone}</p>
                {selectedBooking.email && <p className="text-sm font-semibold text-slate-600">{selectedBooking.email}</p>}
              </div>
              <div className="space-y-1 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                  selectedBooking.status === 'confirmed' ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-700'
                }`}>
                  {selectedBooking.status}
                </div>
              </div>
              <div className="space-y-1 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reference ID</p>
                <p className="font-bold text-slate-800 font-mono text-sm">{selectedBooking.id}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {selectedBooking.status === 'pending' ? (
                <div className="flex gap-1.5 items-center">
                  <button
                    onClick={() => {
                      handleConfirm(selectedBooking.id);
                      setSelectedBooking(null);
                    }}
                    disabled={actionLoadingId !== null}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    {actionLoadingId === selectedBooking.id ? (
                      <RefreshCw size={14} className="animate-spin text-white" />
                    ) : (
                      <Check size={14} strokeWidth={2.5} />
                    )}
                    <span>Confirm</span>
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedBooking.id);
                      setSelectedBooking(null);
                    }}
                    disabled={actionLoadingId !== null}
                    className="flex items-center gap-1 px-3 py-1 text-slate-500 hover:text-rose-600 rounded-lg transition-colors font-bold text-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <X size={15} strokeWidth={2.5} />
                    <span>Reject</span>
                  </button>
                </div>
              ) : selectedBooking.status === 'confirmed' ? (
                <div className="flex gap-1.5 items-center">
                  <button
                    onClick={() => {
                      handleReject(selectedBooking.id);
                      setSelectedBooking(null);
                    }}
                    disabled={actionLoadingId !== null}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    {actionLoadingId === selectedBooking.id ? (
                      <RefreshCw size={14} className="animate-spin text-white" />
                    ) : (
                      <X size={14} strokeWidth={2.5} />
                    )}
                    <span>Cancel Booking</span>
                  </button>
                </div>
              ) : (
                <div />
              )}
              <button 
                onClick={() => {
                  setActiveTab(selectedBooking.status);
                  setFocusedBookingId(selectedBooking.id);
                  setActiveNav('Bookings');
                  setSelectedBooking(null);
                }}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2"
              >
                View Full Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflicts Details Modal */}
      {selectedConflicts && (
        <div 
          onClick={() => setSelectedConflicts(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center p-4 border-b border-rose-100 bg-rose-50 text-rose-900">
              <h3 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                <AlertTriangle size={14} />
                Booking Conflict
              </h3>
              <button onClick={() => setSelectedConflicts(null)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-100 p-1 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm font-semibold text-slate-600">
                There are {selectedConflicts.length} bookings conflicting at this time slot.
              </p>
              <div className="space-y-3">
                {selectedConflicts.map((b, i) => (
                  <div key={i} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-bold text-slate-800">{b.name}</p>
                      <div className={`inline-flex mt-1 items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'confirmed' ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {b.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => {
                  setActiveTab(selectedConflicts[0].status === 'confirmed' ? 'confirmed' : 'pending');
                  setFocusedBookingId(selectedConflicts[0].id);
                  setActiveNav('Bookings');
                  setSelectedConflicts(null);
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline underline-offset-2"
              >
                Resolve in Bookings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
