import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Clock,
} from "lucide-react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad2 = (n) => String(n).padStart(2, "0");

const toYmd = (y, mZeroBased, d) => `${y}-${pad2(mZeroBased + 1)}-${pad2(d)}`;

const parseInputDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return {
      year: val.getFullYear(),
      month: val.getMonth(),
      day: val.getDate(),
      hour: val.getHours(),
      minute: val.getMinutes(),
    };
  }
  const str = String(val).trim();
  if (!str) return null;

  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::\d{1,2})?)?$/);
  if (ymdMatch && !str.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    const y = Number(ymdMatch[1]);
    const m = Number(ymdMatch[2]) - 1;
    const d = Number(ymdMatch[3]);
    const hr = ymdMatch[4] !== undefined ? Number(ymdMatch[4]) : 0;
    const min = ymdMatch[5] !== undefined ? Number(ymdMatch[5]) : 0;
    if (m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      return { year: y, month: m, day: d, hour: hr, minute: min };
    }
  }

  const ymMatch = str.match(/^(\d{4})-(\d{1,2})$/);
  if (ymMatch) {
    return {
      year: Number(ymMatch[1]),
      month: Number(ymMatch[2]) - 1,
      day: 1,
      hour: 0,
      minute: 0,
    };
  }

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return null;
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth(),
    day: parsed.getDate(),
    hour: parsed.getHours(),
    minute: parsed.getMinutes(),
  };
};

const toBoundStr = (bound) => {
  const p = parseInputDate(bound);
  return p ? toYmd(p.year, p.month, p.day) : null;
};

export function MonthYearSelector({
  month,
  year,
  onChange,
  zeroBased = false,
  minYear = 2015,
  maxYear = new Date().getFullYear() + 5,
  className = "",
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const monthBtnRef = useRef(null);
  const yearBtnRef = useRef(null);
  const popoverRef = useRef(null);
  const yearScrollRef = useRef(null);
  const activeYearItemRef = useRef(null);

  const monthIdx = zeroBased ? month : month - 1;
  const yearsList = useMemo(() => {
    const arr = [];
    for (let y = minYear; y <= maxYear; y++) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  const positionPopover = (anchorEl, width = 220) => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    let left = rect.left;
    if (left + width > window.innerWidth - 10) {
      left = Math.max(8, window.innerWidth - width - 10);
    }
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < 240 && rect.top > 240 ? rect.top - 236 : rect.bottom + 6;
    setPos({ top, left });
  };

  useEffect(() => {
    if (!openMenu) return;
    const handleOutside = (e) => {
      if (
        popoverRef.current?.contains(e.target) ||
        containerRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpenMenu(null);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    const handleScroll = (e) => {
      if (popoverRef.current?.contains(e.target)) return;
      setOpenMenu(null);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openMenu]);

  useEffect(() => {
    if (openMenu === "year" && yearScrollRef.current && activeYearItemRef.current) {
      const container = yearScrollRef.current;
      const item = activeYearItemRef.current;
      container.scrollTop =
        item.offsetTop - container.clientHeight / 2 + item.clientHeight / 2;
    }
  }, [openMenu]);

  const emitChange = (nextMonthIdx, nextYear) => {
    const outMonth = zeroBased ? nextMonthIdx : nextMonthIdx + 1;
    onChange?.(outMonth, nextYear);
  };

  const handlePrev = () => {
    if (monthIdx === 0) emitChange(11, year - 1);
    else emitChange(monthIdx - 1, year);
  };

  const handleNext = () => {
    if (monthIdx === 11) emitChange(0, year + 1);
    else emitChange(monthIdx + 1, year);
  };

  return (
    <div ref={containerRef} className={`inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={handlePrev}
        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
        title="Previous Month"
      >
        <ChevronLeft size={14} />
      </button>

      <button
        ref={monthBtnRef}
        type="button"
        onClick={() => {
          if (openMenu === "month") {
            setOpenMenu(null);
          } else {
            positionPopover(monthBtnRef.current, 232);
            setOpenMenu("month");
          }
        }}
        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-1 transition cursor-pointer"
      >
        <span>{MONTH_NAMES[monthIdx] || MONTH_NAMES[0]}</span>
        <ChevronDown size={12} className="text-slate-400" />
      </button>

      <button
        ref={yearBtnRef}
        type="button"
        onClick={() => {
          if (openMenu === "year") {
            setOpenMenu(null);
          } else {
            positionPopover(yearBtnRef.current, 210);
            setOpenMenu("year");
          }
        }}
        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-1 transition cursor-pointer"
      >
        <span>{year}</span>
        <ChevronDown size={12} className="text-slate-400" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
        title="Next Month"
      >
        <ChevronRight size={14} />
      </button>

      {openMenu &&
        createPortal(
          <div
            ref={popoverRef}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              zIndex: 99999,
            }}
            className="bg-white border border-slate-200 rounded-xl shadow-xl p-2 select-none"
          >
            {openMenu === "month" ? (
              <div className="grid grid-cols-3 gap-1 w-[216px]">
                {SHORT_MONTHS.map((mLabel, idx) => {
                  const isActive = idx === monthIdx;
                  return (
                    <button
                      key={mLabel}
                      type="button"
                      onClick={() => {
                        emitChange(idx, year);
                        setOpenMenu(null);
                      }}
                      className={`py-2 px-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white font-bold shadow-xs"
                          : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {mLabel}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                ref={yearScrollRef}
                className="relative w-[196px] max-h-[216px] overflow-y-auto overscroll-contain grid grid-cols-3 gap-1 pr-1"
              >
                {yearsList.map((y) => {
                  const isActive = y === year;
                  return (
                    <button
                      key={y}
                      ref={isActive ? activeYearItemRef : null}
                      type="button"
                      onClick={() => {
                        emitChange(monthIdx, y);
                        setOpenMenu(null);
                      }}
                      className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white font-bold shadow-xs"
                          : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

export function DateInput({
  value,
  selected,
  onChange,
  name = "",
  id = "",
  min,
  max,
  minDate,
  maxDate,
  disabled = false,
  required = false,
  readOnly = false,
  placeholder,
  placeholderText,
  className = "",
  style,
  includeTime = false,
  showMonthYearPicker = false,
  mode = "date",
  isClearable = false,
  hideIcon = false,
  dateFormat,
  minYear = 1940,
  maxYear = 2050,
}) {
  const isMonthOnly = mode === "month" || showMonthYearPicker;
  const isDateObjectMode = selected !== undefined;
  const activeValue = isDateObjectMode ? selected : value;
  const parsedValue = useMemo(() => parseInputDate(activeValue), [activeValue]);

  const minStr = useMemo(() => toBoundStr(min || minDate), [min, minDate]);
  const maxStr = useMemo(() => toBoundStr(max || maxDate), [max, maxDate]);

  const today = new Date();
  const todayStr = toYmd(today.getFullYear(), today.getMonth(), today.getDate());

  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState(isMonthOnly ? "months" : "days");
  const [viewYear, setViewYear] = useState(() => parsedValue?.year || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() =>
    parsedValue?.month !== undefined ? parsedValue.month : today.getMonth()
  );
  const [timeHour, setTimeHour] = useState(() => parsedValue?.hour ?? 10);
  const [timeMinute, setTimeMinute] = useState(() => parsedValue?.minute ?? 0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 284 });

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const yearScrollRef = useRef(null);
  const activeYearRef = useRef(null);

  const parsedSyncKey = parsedValue
    ? `${parsedValue.year}-${parsedValue.month}-${parsedValue.day}-${parsedValue.hour ?? 10}-${parsedValue.minute ?? 0}`
    : "";
  const [prevParsedKey, setPrevParsedKey] = useState(parsedSyncKey);
  if (parsedSyncKey !== prevParsedKey) {
    setPrevParsedKey(parsedSyncKey);
    if (parsedValue) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
      setTimeHour(parsedValue.hour ?? 10);
      setTimeMinute(parsedValue.minute ?? 0);
    }
  }

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popWidth = Math.min(284, window.innerWidth - 16);
    const popHeight = includeTime ? 378 : 330;

    let left = rect.left;
    if (left + popWidth > window.innerWidth - 10) {
      left = Math.max(8, window.innerWidth - popWidth - 10);
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top = rect.bottom + 6;
    if (spaceBelow < popHeight && spaceAbove > spaceBelow) {
      top = Math.max(8, rect.top - popHeight - 6);
    } else if (top + popHeight > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - popHeight - 8);
    }

    setCoords({ top, left, width: popWidth });
  }, [includeTime]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) updatePosition();
    });

    const handleOutside = (e) => {
      if (
        popoverRef.current?.contains(e.target) ||
        triggerRef.current?.contains(e.target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    const handleScrollOrResize = (e) => {
      if (e?.target && popoverRef.current?.contains(e.target)) return;
      updatePosition();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      cancelled = true;
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (isOpen && viewMode === "years" && yearScrollRef.current && activeYearRef.current) {
      const container = yearScrollRef.current;
      const item = activeYearRef.current;
      container.scrollTop =
        item.offsetTop - container.clientHeight / 2 + item.clientHeight / 2;
    }
  }, [isOpen, viewMode]);

  const effectiveMinYear = useMemo(() => {
    if (!minStr) return minYear;
    const y = Number(minStr.slice(0, 4));
    return Math.min(minYear, y);
  }, [minStr, minYear]);

  const effectiveMaxYear = useMemo(() => {
    if (!maxStr) return maxYear;
    const y = Number(maxStr.slice(0, 4));
    return Math.max(maxYear, y);
  }, [maxStr, maxYear]);

  const yearsList = useMemo(() => {
    const arr = [];
    for (let y = effectiveMinYear; y <= effectiveMaxYear; y++) arr.push(y);
    return arr;
  }, [effectiveMinYear, effectiveMaxYear]);

  const emitSelection = (y, mZero, d, hr = timeHour, minVal = timeMinute) => {
    if (!onChange) return;
    if (y === null) {
      if (isDateObjectMode) {
        onChange(null);
      } else {
        onChange({
          target: {
            name,
            id,
            value: "",
            type: includeTime ? "datetime-local" : "date",
          },
        });
      }
      return;
    }

    if (isDateObjectMode) {
      const nextDate = includeTime
        ? new Date(y, mZero, d, hr, minVal, 0, 0)
        : new Date(y, mZero, d, 0, 0, 0, 0);
      onChange(nextDate);
      return;
    }

    const datePart = isMonthOnly
      ? `${y}-${pad2(mZero + 1)}`
      : toYmd(y, mZero, d);
    const outStr = includeTime
      ? `${datePart}T${pad2(hr)}:${pad2(minVal)}`
      : datePart;

    onChange({
      target: {
        name,
        id,
        value: outStr,
        type: includeTime ? "datetime-local" : "date",
      },
    });
  };

  const isDateDisabled = (y, mZero, d) => {
    const cur = toYmd(y, mZero, d);
    if (minStr && cur < minStr) return true;
    if (maxStr && cur > maxStr) return true;
    return false;
  };

  const isMonthDisabled = (y, mZero) => {
    const monthStart = toYmd(y, mZero, 1);
    const daysInMon = new Date(y, mZero + 1, 0).getDate();
    const monthEnd = toYmd(y, mZero, daysInMon);
    if (minStr && monthEnd < minStr) return true;
    if (maxStr && monthStart > maxStr) return true;
    return false;
  };

  const handleOpenToggle = () => {
    if (disabled || readOnly) return;
    if (!isOpen) {
      setViewMode(isMonthOnly ? "months" : "days");
      setViewYear(parsedValue?.year || today.getFullYear());
      setViewMonth(
        parsedValue?.month !== undefined ? parsedValue.month : today.getMonth()
      );
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelectDay = (day) => {
    if (isDateDisabled(viewYear, viewMonth, day)) return;
    emitSelection(viewYear, viewMonth, day, timeHour, timeMinute);
    if (!includeTime) {
      setIsOpen(false);
    }
  };

  const handleSelectToday = () => {
    const ty = today.getFullYear();
    const tm = today.getMonth();
    const td = today.getDate();
    if (isDateDisabled(ty, tm, td)) {
      setViewYear(ty);
      setViewMonth(tm);
      return;
    }
    setViewYear(ty);
    setViewMonth(tm);
    emitSelection(ty, tm, td, timeHour, timeMinute);
    if (!includeTime) setIsOpen(false);
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    emitSelection(null);
    setIsOpen(false);
  };

  const handlePrevNav = () => {
    if (viewMode === "days") {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    } else if (viewMode === "months") {
      setViewYear((y) => Math.max(effectiveMinYear, y - 1));
    } else {
      setViewYear((y) => Math.max(effectiveMinYear, y - 10));
    }
  };

  const handleNextNav = () => {
    if (viewMode === "days") {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    } else if (viewMode === "months") {
      setViewYear((y) => Math.min(effectiveMaxYear, y + 1));
    } else {
      setViewYear((y) => Math.min(effectiveMaxYear, y + 10));
    }
  };

  const displayLabel = useMemo(() => {
    if (!parsedValue) return "";
    if (isMonthOnly || dateFormat === "MMMM yyyy") {
      return `${MONTH_NAMES[parsedValue.month]} ${parsedValue.year}`;
    }
    if (dateFormat === "dd MMM yyyy") {
      return `${pad2(parsedValue.day)} ${SHORT_MONTHS[parsedValue.month]} ${parsedValue.year}`;
    }
    const base = `${pad2(parsedValue.day)}/${pad2(parsedValue.month + 1)}/${parsedValue.year}`;
    if (includeTime) {
      return `${base}, ${pad2(parsedValue.hour)}:${pad2(parsedValue.minute)}`;
    }
    return base;
  }, [parsedValue, isMonthOnly, dateFormat, includeTime]);

  const fallbackPlaceholder =
    placeholder ||
    placeholderText ||
    (isMonthOnly
      ? "Select month"
      : includeTime
      ? "dd/mm/yyyy, hh:mm"
      : "dd/mm/yyyy");

  const isTransparent = className.includes("bg-transparent");
  const isFullWidth = className.includes("w-full") || !className;
  const triggerClasses = className
    ? `${className} flex items-center justify-between gap-1.5 text-left ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`
    : `w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:border-blue-600 focus:outline-none flex items-center justify-between gap-2 text-left ${
        disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "cursor-pointer"
      }`;

  const firstDayOffset = new Date(viewYear, viewMonth, 1).getDay();
  const daysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const calendarCells = [];
  for (let i = firstDayOffset - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthDays - i,
      outside: true,
      key: `prev-${prevMonthDays - i}`,
    });
  }
  for (let d = 1; d <= daysInViewMonth; d++) {
    calendarCells.push({ day: d, outside: false, key: `cur-${d}` });
  }
  const trailing = 42 - calendarCells.length;
  for (let d = 1; d <= trailing; d++) {
    calendarCells.push({ day: d, outside: true, key: `next-${d}` });
  }

  return (
    <div
      className={`relative ${isFullWidth ? "w-full block" : "inline-block"}`}
    >
      {required && (
        <input
          type="text"
          tabIndex={-1}
          aria-hidden="true"
          required
          value={parsedValue ? toYmd(parsedValue.year, parsedValue.month, parsedValue.day) : ""}
          onChange={() => {}}
          className="opacity-0 pointer-events-none absolute inset-0 w-full h-full"
        />
      )}

      <button
        ref={triggerRef}
        id={id || undefined}
        type="button"
        disabled={disabled}
        onClick={handleOpenToggle}
        style={style}
        className={triggerClasses}
      >
        <span
          className={`truncate tabular-nums ${
            displayLabel ? "" : "text-slate-400 font-normal"
          }`}
        >
          {displayLabel || fallbackPlaceholder}
        </span>

        <span className="flex items-center gap-1 shrink-0">
          {isClearable && parsedValue && !disabled && !readOnly && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors cursor-pointer"
              title="Clear date"
            >
              <X size={12} />
            </span>
          )}
          {!hideIcon && !isTransparent && (
            <CalendarIcon size={13} className="text-slate-400 shrink-0" />
          )}
        </span>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 99999,
            }}
            className="bg-white border border-slate-200 rounded-xl shadow-2xl p-3 text-slate-800 select-none animate-in fade-in duration-100"
          >
            <div className="flex items-center justify-between gap-1 pb-2.5 mb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={handlePrevNav}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Previous"
              >
                <ChevronLeft size={15} />
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setViewMode((prev) => (prev === "months" ? (isMonthOnly ? "months" : "days") : "months"))
                  }
                  className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === "months"
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span>{MONTH_NAMES[viewMonth]}</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewMode((prev) =>
                      prev === "years" ? (isMonthOnly ? "months" : "days") : "years"
                    )
                  }
                  className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === "years"
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span>{viewYear}</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextNav}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Next"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {viewMode === "years" && (
              <div
                ref={yearScrollRef}
                className="relative h-[220px] overflow-y-auto overscroll-contain grid grid-cols-3 gap-1.5 pr-1 py-0.5"
              >
                {yearsList.map((y) => {
                  const isActive = y === viewYear;
                  const outOfRange =
                    (minStr && y < Number(minStr.slice(0, 4))) ||
                    (maxStr && y > Number(maxStr.slice(0, 4)));

                  return (
                    <button
                      key={y}
                      ref={isActive ? activeYearRef : null}
                      type="button"
                      disabled={outOfRange}
                      onClick={() => {
                        setViewYear(y);
                        setViewMode(isMonthOnly ? "months" : "days");
                      }}
                      className={`py-2 rounded-lg text-xs font-semibold transition ${
                        outOfRange
                          ? "text-slate-300 cursor-not-allowed"
                          : isActive
                          ? "bg-blue-600 text-white font-bold shadow-xs cursor-pointer"
                          : "text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}

            {viewMode === "months" && (
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {SHORT_MONTHS.map((label, mIdx) => {
                  const isDisabled = isMonthDisabled(viewYear, mIdx);
                  const isCurrentSelected =
                    parsedValue &&
                    parsedValue.year === viewYear &&
                    parsedValue.month === mIdx;
                  const isViewActive = viewMonth === mIdx;

                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        setViewMonth(mIdx);
                        if (isMonthOnly) {
                          emitSelection(viewYear, mIdx, 1);
                          setIsOpen(false);
                        } else {
                          setViewMode("days");
                        }
                      }}
                      className={`py-2.5 rounded-lg text-xs font-semibold transition ${
                        isDisabled
                          ? "text-slate-300 cursor-not-allowed"
                          : isCurrentSelected
                          ? "bg-blue-600 text-white font-bold shadow-xs cursor-pointer"
                          : isViewActive
                          ? "bg-blue-50 text-blue-700 font-bold border border-blue-200 cursor-pointer"
                          : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {viewMode === "days" && (
              <div>
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {WEEKDAYS.map((wd) => (
                    <div
                      key={wd}
                      className="text-center text-[10px] font-bold text-slate-400 uppercase py-1"
                    >
                      {wd}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0.5">
                  {calendarCells.map((cell) => {
                    if (cell.outside) {
                      return (
                        <div
                          key={cell.key}
                          className="h-8 flex items-center justify-center text-[11px] text-slate-300"
                        >
                          {cell.day}
                        </div>
                      );
                    }

                    const curStr = toYmd(viewYear, viewMonth, cell.day);
                    const isDisabled = isDateDisabled(viewYear, viewMonth, cell.day);
                    const isSelected =
                      parsedValue &&
                      parsedValue.year === viewYear &&
                      parsedValue.month === viewMonth &&
                      parsedValue.day === cell.day;
                    const isToday = curStr === todayStr;

                    return (
                      <button
                        key={cell.key}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleSelectDay(cell.day)}
                        className={`h-8 rounded-lg text-xs font-medium flex items-center justify-center transition ${
                          isDisabled
                            ? "text-slate-300 cursor-not-allowed"
                            : isSelected
                            ? "bg-blue-600 text-white font-bold shadow-xs cursor-pointer"
                            : isToday
                            ? "bg-blue-50 text-blue-700 font-bold border border-blue-300 hover:bg-blue-100 cursor-pointer"
                            : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                        }`}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {includeTime && viewMode === "days" && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Clock size={12} />
                  Time
                </span>
                <div className="flex items-center gap-1">
                  <select
                    value={timeHour}
                    onChange={(e) => {
                      const nextHr = Number(e.target.value);
                      setTimeHour(nextHr);
                      const y = parsedValue?.year ?? viewYear;
                      const m = parsedValue?.month ?? viewMonth;
                      const d = parsedValue?.day ?? today.getDate();
                      emitSelection(y, m, d, nextHr, timeMinute);
                    }}
                    className="px-1.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>
                        {pad2(h)}
                      </option>
                    ))}
                  </select>
                  <span className="font-bold text-slate-400">:</span>
                  <select
                    value={timeMinute}
                    onChange={(e) => {
                      const nextMin = Number(e.target.value);
                      setTimeMinute(nextMin);
                      const y = parsedValue?.year ?? viewYear;
                      const m = parsedValue?.month ?? viewMonth;
                      const d = parsedValue?.day ?? today.getDate();
                      emitSelection(y, m, d, timeHour, nextMin);
                    }}
                    className="px-1.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    {Array.from({ length: 60 }, (_, m) => (
                      <option key={m} value={m}>
                        {pad2(m)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="ml-1 px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-500 hover:text-rose-600 font-semibold px-1.5 py-0.5 rounded hover:bg-rose-50 transition cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleSelectToday}
                className="text-blue-600 hover:text-blue-700 font-bold px-2 py-0.5 rounded hover:bg-blue-50 transition cursor-pointer"
              >
                {isMonthOnly ? "This Month" : "Today"}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default DateInput;
