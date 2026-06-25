import React from 'react';
import { format } from 'date-fns';
import { X, Check, RefreshCw, AlertTriangle, ChevronRight, User, Phone, Mail, Calendar, MapPin, Clock } from 'lucide-react';

export function BookingCard({
  booking: b,
  handleConfirm,
  handleReject,
  handleCancelSlot,
  actionLoadingId,
  isDoubleBooked,
  setActiveNav
}: any) {
  const doubleBooked = isDoubleBooked ? isDoubleBooked(b) : false;
  const createdAtFormatted = b.createdAt ? format(new Date(b.createdAt), "MMM d, h:mm a") : 'N/A';
  const shortId = b.id.includes('-') ? b.id : b.id.substring(0, 8).toUpperCase();
  const activeSlots = b.slots?.filter((s: any) => s.status !== 'rejected') || [];
  const totalSlots = b.slots?.length || 0;
  const totalPrice = activeSlots.length * 500;
  
  // Group slots by court
  const slotsByCourt = b.slots?.reduce((acc: any, slot: any) => {
    if (!acc[slot.court]) acc[slot.court] = [];
    acc[slot.court].push(slot);
    return acc;
  }, {}) || {};

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      return format(new Date(year, month - 1, day), 'MMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className={`p-5 border rounded-xl transition-all group flex flex-col gap-4 ${
      doubleBooked ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Grid Layout for Header & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(90px,_1fr)_minmax(140px,_1.3fr)_minmax(180px,_1.8fr)_minmax(130px,_1.2fr)] gap-5 items-start flex-1 min-w-0">
        {/* Row 1: Headers (hidden on mobile, visible on desktop) */}
        <div className="hidden lg:contents">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-400 pb-2 self-stretch flex items-end">Ref No</p>
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-400 pb-2 self-stretch flex items-end">Customer Info</p>
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-400 pb-2 self-stretch flex items-end">Reservation Details</p>
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-400 pb-2 self-stretch flex items-end">Total Amount Due</p>
        </div>

        {/* Row 2: Content Columns */}
        {/* Column 1: Ref No */}
        <div className="space-y-1">
          <p className="lg:hidden text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-400 pb-1 mb-1.5">Ref No</p>
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-slate-900">#{shortId}</span>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
              b.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-200'
              : b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {b.status}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-600 pt-0.5">
            <span className="text-slate-500 font-extrabold">Submitted: </span>
            {createdAtFormatted}
          </p>
        </div>

        {/* Column 2: Customer Info */}
        <div className="space-y-1 text-sm text-slate-600">
          <p className="lg:hidden text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-400 pb-1 mb-1.5">Customer Info</p>
          <div className="flex items-center gap-2 font-extrabold text-slate-800">
            <User size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{b.name}</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <Phone size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{b.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Mail size={14} className="text-slate-400 shrink-0" />
            <span className="truncate text-xs">{b.email}</span>
          </div>
        </div>

        {/* Column 3: Reservation Details */}
        <div className="space-y-2">
          <p className="lg:hidden text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-400 pb-1 mb-1.5">Reservation Details</p>
          {Object.entries(slotsByCourt).map(([court, slots]: [string, any]) => (
            <div key={court} className="space-y-1">
              {/* Row 1: Date */}
              <div className="flex items-center gap-1.5 text-sm text-slate-700 font-semibold">
                <Calendar size={13} className="text-slate-400 shrink-0" />
                <span>{formatDate(slots[0]?.date)}</span>
              </div>
              {/* Row 2: Court number */}
              <div className="flex items-center gap-1.5 text-sm text-slate-800 font-extrabold">
                <MapPin size={13} className="text-slate-400 shrink-0" />
                <span>Court {court}</span>
              </div>
              {/* Row 3: Time */}
              <div className="flex items-start gap-1.5 text-sm text-slate-900 font-black mt-1">
                <Clock size={13} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1.5 w-full">
                  {slots.map((s:any) => (
                    <div key={s.timeSlot} className="flex items-center gap-2">
                      <span className={s.status === 'rejected' ? 'line-through text-slate-400' : ''}>{s.timeSlot}</span>
                      {s.status === 'rejected' && (
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-wide">Rejected</span>
                      )}
                      {b.status === 'confirmed' && totalSlots > 1 && s.status !== 'rejected' && (
                        <button
                          onClick={() => handleCancelSlot(b.id, s.court, s.date, s.timeSlot)}
                          disabled={actionLoadingId !== null}
                          className="text-[10px] text-rose-500 hover:text-rose-700 hover:bg-rose-100 bg-rose-50 px-1.5 py-0.5 rounded cursor-pointer transition-colors border border-rose-100"
                        >
                          Cancel Slot
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Column 4: Total Amount Due */}
        <div className="space-y-1">
          <p className="lg:hidden text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b-2 border-slate-400 pb-1 mb-1.5">Total Amount Due</p>
          <p className="text-xl font-black text-slate-900">₱{totalPrice.toLocaleString()}</p>
        </div>
      </div>

        {/* Actions */}
        {b.status === 'pending' && (
          <div className="flex flex-col gap-1.5 items-end justify-center shrink-0 self-stretch lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0">
            {doubleBooked ? (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                  <AlertTriangle size={14} />
                  Conflict
                </span>
                <button
                  onClick={() => setActiveNav && setActiveNav('Bookings')}
                  className="flex items-center gap-1 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Go to Bookings
                  <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 items-center w-full">
                <button
                  onClick={() => handleConfirm(b.id)}
                  disabled={actionLoadingId !== null}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  {actionLoadingId === b.id ? (
                    <RefreshCw size={14} className="animate-spin text-white" />
                  ) : (
                    <Check size={14} strokeWidth={2.5} />
                  )}
                  <span>Confirm</span>
                </button>
                <button
                  onClick={() => handleReject(b.id)}
                  disabled={actionLoadingId !== null}
                  className="flex items-center gap-1 px-3 py-1 text-slate-500 hover:text-rose-600 rounded-lg transition-colors font-bold text-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  <X size={15} strokeWidth={2.5} />
                  <span>Reject</span>
                </button>
              </div>
            )}
          </div>
        )}

        {b.status === 'confirmed' && totalSlots === 1 && (
          <div className="flex flex-col gap-1.5 items-end justify-center shrink-0 self-stretch lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0">
            <button
              onClick={() => handleReject(b.id)}
              disabled={actionLoadingId !== null}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-sm cursor-pointer whitespace-nowrap"
            >
              {actionLoadingId === b.id ? (
                <RefreshCw size={14} className="animate-spin text-white" />
              ) : (
                <X size={14} strokeWidth={2.5} />
              )}
              <span>Cancel Booking</span>
            </button>
          </div>
        )}
      </div>

      {b.status === 'confirmed' && totalSlots > 1 && (
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 border border-slate-300">
                <AlertTriangle className="text-slate-500 w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Multiple Slots Booking</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">This booking contains multiple slots. You can manage individual slots above or cancel the entire booking.</p>
              </div>
            </div>
            <button
              onClick={() => handleReject(b.id)}
              disabled={actionLoadingId !== null}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg font-bold text-sm transition-colors cursor-pointer shadow-sm"
            >
              {actionLoadingId === b.id ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <X size={14} strokeWidth={2.5} />
              )}
              <span>Cancel Entire Booking</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
