"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Sparkles,
} from "lucide-react";

interface PremiumDateTimePickerProps {
  value: string; // ISO string or YYYY-MM-DDTHH:mm
  onChange: (value: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  className?: string;
  required?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SHORT_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const PRESET_HOURS = [
  { label: "10:00 AM", h: 10, m: 0, p: "AM" },
  { label: "11:30 AM", h: 11, m: 30, p: "AM" },
  { label: "02:00 PM", h: 2, m: 0, p: "PM" },
  { label: "03:30 PM", h: 3, m: 30, p: "PM" },
  { label: "05:00 PM", h: 5, m: 0, p: "PM" },
];

export function PremiumDateTimePicker({
  value,
  onChange,
  placeholder = "Select Date & Start Time",
  minYear = new Date().getFullYear(),
  maxYear = new Date().getFullYear() + 2,
  className = "",
  required = false,
}: PremiumDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"date" | "time">("date");
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse incoming value or default to tomorrow at 10:00 AM
  const parsedDate = value ? new Date(value) : null;
  const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

  const initialYear = isValidDate ? parsedDate.getFullYear() : new Date().getFullYear();
  const initialMonth = isValidDate ? parsedDate.getMonth() : new Date().getMonth();
  const initialDay = isValidDate ? parsedDate.getDate() : new Date().getDate();

  // Time components in 12-hour format
  const rawHour = isValidDate ? parsedDate.getHours() : 10;
  const initialPeriod = rawHour >= 12 ? "PM" : "AM";
  const initial12Hour = rawHour % 12 === 0 ? 12 : rawHour % 12;
  const initialMinute = isValidDate ? parsedDate.getMinutes() : 0;

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(isValidDate ? initialDay : null);

  const [selectedHour, setSelectedHour] = useState<number>(initial12Hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(initialMinute);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(initialPeriod as "AM" | "PM");

  // Keep internal state synchronized with prop value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
        setSelectedDay(d.getDate());

        const h = d.getHours();
        setSelectedPeriod(h >= 12 ? "PM" : "AM");
        setSelectedHour(h % 12 === 0 ? 12 : h % 12);
        setSelectedMinute(d.getMinutes());
      }
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Helper to commit combined date & time back to caller
  const commitValue = (
    y: number,
    m: number,
    d: number | null,
    hour12: number,
    min: number,
    period: "AM" | "PM",
  ) => {
    if (!d) return;

    let hour24 = hour12;
    if (period === "AM" && hour12 === 12) hour24 = 0;
    if (period === "PM" && hour12 !== 12) hour24 = hour12 + 12;

    const formattedMonth = String(m + 1).padStart(2, "0");
    const formattedDay = String(d).padStart(2, "0");
    const formattedHour = String(hour24).padStart(2, "0");
    const formattedMinute = String(min).padStart(2, "0");

    const isoString = `${y}-${formattedMonth}-${formattedDay}T${formattedHour}:${formattedMinute}`;
    onChange(isoString);
  };

  // Month navigation
  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => Math.max(minYear - 1, y - 1));
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => Math.min(maxYear + 1, y + 1));
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Day selection
  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    commitValue(viewYear, viewMonth, day, selectedHour, selectedMinute, selectedPeriod);
    setActiveTab("time"); // Smooth progression to time picker
  };

  // Time component updates
  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour);
    commitValue(viewYear, viewMonth, selectedDay, hour, selectedMinute, selectedPeriod);
  };

  const handleMinuteSelect = (min: number) => {
    setSelectedMinute(min);
    commitValue(viewYear, viewMonth, selectedDay, selectedHour, min, selectedPeriod);
  };

  const handlePeriodToggle = (period: "AM" | "PM") => {
    setSelectedPeriod(period);
    commitValue(viewYear, viewMonth, selectedDay, selectedHour, selectedMinute, period);
  };

  const handleApplyPreset = (preset: typeof PRESET_HOURS[0]) => {
    setSelectedHour(preset.h);
    setSelectedMinute(preset.m);
    setSelectedPeriod(preset.p as "AM" | "PM");
    commitValue(viewYear, viewMonth, selectedDay, preset.h, preset.m, preset.p as "AM" | "PM");
  };

  const handleQuickDay = (daysOffset: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setSelectedDay(target.getDate());
    commitValue(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
      selectedHour,
      selectedMinute,
      selectedPeriod,
    );
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDay(null);
    onChange("");
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Formatted display value
  const displayValue = isValidDate
    ? `${parsedDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })} at ${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")} ${selectedPeriod}`
    : "";

  const years = [];
  for (let y = minYear - 1; y <= maxYear; y++) {
    years.push(y);
  }

  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutesList = [0, 15, 30, 45];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm cursor-pointer transition shadow-sm ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {displayValue ? (
            <span className="font-bold text-slate-900">{displayValue}</span>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>

        {displayValue && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {required && (
        <input
          type="text"
          value={value}
          required={required}
          readOnly
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Premium Popover Dialog */}
      {isOpen && (
        <div className="absolute top-full left-0 sm:right-auto mt-2 z-50 w-84 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Segmented Tab Switcher (Date vs Time) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("date")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeTab === "date"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600" /> Date
              {selectedDay && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-md">
                  {selectedDay} {MONTH_NAMES[viewMonth].substring(0, 3)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("time")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                activeTab === "time"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" /> Time
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-md">
                {String(selectedHour).padStart(2, "0")}:{String(selectedMinute).padStart(2, "0")}{" "}
                {selectedPeriod}
              </span>
            </button>
          </div>

          {/* TAB 1: DATE SELECTOR */}
          {activeTab === "date" && (
            <div>
              {/* Quick Preset Days */}
              <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100 overflow-x-auto text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickDay(0)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 font-semibold text-slate-700 border border-slate-200 transition shrink-0"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDay(1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 font-semibold text-slate-700 border border-slate-200 transition shrink-0"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDay(2)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 font-semibold text-slate-700 border border-slate-200 transition shrink-0"
                >
                  In 2 Days
                </button>
              </div>

              {/* Month & Year Select Header */}
              <div className="flex items-center justify-between pb-2 mb-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  <select
                    value={viewMonth}
                    onChange={(e) => setViewMonth(Number(e.target.value))}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <select
                    value={viewYear}
                    onChange={(e) => setViewYear(Number(e.target.value))}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day of Week Labels */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {SHORT_DAYS.map((d) => (
                  <span key={d} className="text-[11px] font-bold text-slate-400 py-1">
                    {d}
                  </span>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <span key={`p-${i}`} className="text-xs text-slate-300 py-1.5 select-none">
                    {daysInPrevMonth - firstDayOfWeek + i + 1}
                  </span>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isSelected = selectedDay === day;
                  const isToday =
                    new Date().getDate() === day &&
                    new Date().getMonth() === viewMonth &&
                    new Date().getFullYear() === viewYear;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`text-xs font-bold py-1.5 rounded-lg transition ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                          : isToday
                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-300"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TIME & CLOCK SELECTOR */}
          {activeTab === "time" && (
            <div className="space-y-4">
              {/* Quick Presets */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Popular Interview Slots
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PRESET_HOURS.map((p) => {
                    const isCurrent =
                      selectedHour === p.h &&
                      selectedMinute === p.m &&
                      selectedPeriod === p.p;

                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          isCurrent
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AM / PM Segmented Control */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> Meridiem
                </span>
                <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => handlePeriodToggle("AM")}
                    className={`px-4 py-1 rounded-md transition ${
                      selectedPeriod === "AM"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePeriodToggle("PM")}
                    className={`px-4 py-1 rounded-md transition ${
                      selectedPeriod === "PM"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Hour Grid (1 to 12) */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Hour (1 - 12)
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {hoursList.map((h) => {
                    const isSelected = selectedHour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleHourSelect(h)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                        }`}
                      >
                        {String(h).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minute Grid */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Minute (:00, :15, :30, :45)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {minutesList.map((m) => {
                    const isSelected = selectedMinute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleMinuteSelect(m)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                        }`}
                      >
                        :{String(m).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
              {selectedDay
                ? `${MONTH_NAMES[viewMonth].substring(0, 3)} ${selectedDay}, ${viewYear} • ${String(
                    selectedHour,
                  ).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")} ${selectedPeriod}`
                : "Select day & time"}
            </span>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition inline-flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" /> Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
