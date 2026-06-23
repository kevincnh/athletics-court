import React, { useState } from 'react';
import { Court } from './components/Court';
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
  CheckCircle2 
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isBefore, startOfDay } from 'date-fns';

export default function App() {
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  // Booking Flow Steps: 'selection' | 'form' | 'success'
  const [bookingStep, setBookingStep] = useState<'selection' | 'form' | 'success'>('selection');

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  const times = ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '06:30 PM'];

  const handleCourtSelect = (num: number) => {
    setSelectedCourt(num);
    setSelectedDate(null);
    setSelectedTime(null);
    setBookingStep('selection');
    // Reset form fields
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setErrors({});
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const today = startOfDay(new Date());

  // Form Validation
  const validateForm = () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
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

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setBookingStep('success');
    }
  };

  const resetAll = () => {
    setSelectedCourt(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setBookingStep('selection');
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
          <div className="flex flex-col h-full min-h-[600px] md:min-h-[800px] z-10 pt-16 md:pt-20 pb-4">
            
            {/* Layout Grid */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8">
              
              {/* Left Column - Facilities */}
              <div className="w-full md:w-[25%] flex flex-row md:flex-col gap-4 md:gap-6">
                <div className="flex-1 min-h-[80px] bg-white/80 backdrop-blur border-4 border-slate-300 rounded-2xl flex items-center justify-center font-black text-slate-600 text-sm md:text-lg tracking-widest shadow-sm hover:bg-white transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-6 h-6 text-slate-400" />
                    <span>REST ROOMS</span>
                  </div>
                </div>
                <div className="flex-1 min-h-[80px] bg-white/80 backdrop-blur border-4 border-slate-300 rounded-2xl flex items-center justify-center font-black text-slate-600 text-sm md:text-lg tracking-widest shadow-sm hover:bg-white transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <MapIcon className="w-6 h-6 text-slate-400" />
                    <span>CAFE</span>
                  </div>
                </div>
                <div className="flex-1 min-h-[80px] bg-white/80 backdrop-blur border-4 border-slate-300 rounded-t-2xl border-b-0 flex items-end justify-center pb-4 md:pb-8 font-black text-slate-600 text-sm md:text-lg tracking-widest shadow-sm hover:bg-white transition-colors relative overflow-hidden">
                  <div className="absolute bottom-0 w-full h-2 bg-amber-400"></div>
                  <span>ENTRY</span>
                </div>
              </div>

              {/* Walkway divider */}
              <div className="hidden md:flex w-4 bg-slate-300/50 rounded-full mx-2"></div>

              {/* Middle Column - Courts 1,2,3 */}
              <div className="w-full md:w-[32%] flex flex-col gap-4 md:gap-6">
                 {[1, 2, 3].map(num => (
                   <Court
                     key={num}
                     number={num}
                     selected={selectedCourt === num}
                     onClick={() => handleCourtSelect(num)}
                   />
                 ))}
              </div>

              {/* Right Column - Courts 4,5,6 */}
              <div className="w-full md:w-[32%] flex flex-col gap-4 md:gap-6">
                 {[4, 5, 6].map(num => (
                   <Court
                     key={num}
                     number={num}
                     selected={selectedCourt === num}
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

          {selectedCourt ? (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
              
              {/* Selected Court Details */}
              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 mb-8 flex items-center gap-4 relative overflow-hidden group hover:border-amber-200 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="bg-amber-400 text-amber-950 w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-400/30 relative z-10 shrink-0">
                  {selectedCourt}
                </div>
                <div className="relative z-10">
                  <div className="font-black text-xl text-slate-800 tracking-tight">Court {selectedCourt}</div>
                  <div className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" /> Indoor Standard
                  </div>
                </div>
              </div>

              {/* STEP 1: Date & Time Selection */}
              {bookingStep === 'selection' && (
                <div className="flex-1 flex flex-col">
                  {!selectedDate ? (
                    <div className="space-y-4 flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <CalendarDays className="w-5 h-5 text-slate-400" />
                        Select a Date
                      </h3>
                      
                      <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                          <button 
                            onClick={prevMonth}
                            disabled={isBefore(currentMonth, startOfMonth(today))}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <h4 className="font-black text-slate-800 text-lg">
                            {format(currentMonth, 'MMMM yyyy')}
                          </h4>
                          <button 
                            onClick={nextMonth}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-center text-xs font-bold text-slate-400 py-1">
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {calendarDays.map((date, i) => {
                            const isPast = isBefore(date, today);
                            const isCurrentMonth = isSameMonth(date, currentMonth);
                            const isToday = isSameDay(date, today);

                            return (
                              <button 
                                key={i}
                                disabled={isPast}
                                onClick={() => setSelectedDate(date)}
                                className={`
                                  aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all
                                  ${!isCurrentMonth ? 'text-slate-300' : ''}
                                  ${isPast ? 'opacity-40 cursor-not-allowed text-slate-400' : 'hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 cursor-pointer border-2 border-transparent'}
                                  ${isToday && !isPast ? 'bg-slate-800 text-white hover:bg-slate-700' : ''}
                                  ${isCurrentMonth && !isPast && !isToday ? 'bg-slate-50 text-slate-700' : ''}
                                `}
                              >
                                {format(date, 'd')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-slate-400" />
                          Available Times
                        </h3>
                        <button 
                          onClick={() => { setSelectedDate(null); setSelectedTime(null); }}
                          className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          {format(selectedDate, 'MMM d, yyyy')} • Change
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {times.map((time, i) => (
                          <button 
                            key={i}
                            onClick={() => setSelectedTime(time)}
                            className={`py-3 px-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                              selectedTime === time
                                ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm'
                                : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {time}
                            {selectedTime === time && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary & Proceed to Form */}
                  <div className="mt-8 pt-6 border-t-2 border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-bold text-slate-500">Hourly Rate</span>
                      <span className="font-black text-2xl text-slate-800">500 pesos</span>
                    </div>

                    <button 
                      disabled={!selectedDate || !selectedTime}
                      onClick={() => setBookingStep('form')}
                      className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                        selectedDate && selectedTime 
                          ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-xl shadow-slate-800/20 active:scale-[0.98]' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {selectedDate && selectedTime ? 'Proceed to Details' : (!selectedDate ? 'Select a Date First' : 'Select a Time')}
                      {selectedDate && selectedTime && <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Customer Details Form */}
              {bookingStep === 'form' && (
                <form onSubmit={handleConfirmBooking} className="flex-1 flex flex-col space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <button 
                      type="button"
                      onClick={() => setBookingStep('selection')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-bold text-slate-800 text-lg">Enter Details</h3>
                  </div>

                  {/* Summary of choice */}
                  <div className="text-sm font-medium text-slate-600 bg-amber-50 border border-amber-200/50 rounded-xl p-3 mb-2 flex flex-col gap-1">
                    <div><span className="font-bold text-amber-950">Date:</span> {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}</div>
                    <div><span className="font-bold text-amber-950">Time Slot:</span> {selectedTime}</div>
                    <div><span className="font-bold text-amber-950">Amount Due:</span> 500 pesos</div>
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

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                    </label>
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

                  {/* Contact Number Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Contact Number
                    </label>
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09171234567"
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-slate-50 focus:bg-white transition-all font-semibold outline-none text-slate-800 ${
                        errors.phone ? 'border-red-400 focus:border-red-500' : 'border-slate-100 focus:border-amber-400'
                      }`}
                    />
                    {errors.phone && <p className="text-xs font-bold text-red-500">{errors.phone}</p>}
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

                  {/* Submit Button */}
                  <button 
                    type="submit"
                    className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-800/20 active:scale-[0.98] mt-4"
                  >
                    Confirm Booking
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </form>
              )}

              {/* STEP 3: Success Screen */}
              {bookingStep === 'success' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-500 ease-out fill-mode-both">
                  <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full shadow-lg shadow-emerald-200">
                    <CheckCircle2 className="w-16 h-16" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">Booking Confirmed!</h3>
                    <p className="text-slate-500 font-medium mt-1">We look forward to seeing you at the court.</p>
                  </div>

                  <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-left text-sm space-y-3 font-semibold text-slate-700">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-400">Court Selected</span>
                      <span className="text-slate-800 font-bold">Court {selectedCourt}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-400">Date</span>
                      <span className="text-slate-800 font-bold">{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-400">Time Slot</span>
                      <span className="text-slate-800 font-bold">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-400">Reserved For</span>
                      <span className="text-slate-800 font-bold">{name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-400">Email</span>
                      <span className="text-slate-800 font-bold truncate max-w-[180px]">{email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount Due</span>
                      <span className="text-slate-800 font-bold">500 pesos</span>
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
