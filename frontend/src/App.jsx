import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek, isToday } from 'date-fns';

/**
 * FONT STANDARDS (Optimized for 100% zoom):
 * - H1: text-3xl font-black
 * - H2: text-xl font-black
 * - Label/Sub: text-[9px] font-black uppercase tracking-wider
 * - Body/Input: text-sm font-bold
 * - Tiny: text-[8px] font-bold
 */

const Calendar = ({ year, leaveDates, manualSickDays, manualPaidDays, manualHolidays, removedHolidays, holidays, onDayClick }) => {
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-4 print:gap-x-4 print:gap-y-2">
      {months.map((month) => (
        <Month 
          key={month.toISOString()} 
          month={month} 
          leaveDates={leaveDates} 
          manualSickDays={manualSickDays}
          manualPaidDays={manualPaidDays}
          manualHolidays={manualHolidays}
          removedHolidays={removedHolidays}
          holidays={holidays} 
          onDayClick={onDayClick}
        />
      ))}
    </div>
  );
};

const Month = ({ month, leaveDates, manualSickDays, manualPaidDays, manualHolidays, removedHolidays, holidays, onDayClick }) => {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start, end });
  const holidayMap = holidays.reduce((acc, h) => { acc[h.date] = h.name; return acc; }, {});

  return (
    <div className="themed-card p-4 rounded-xl shadow-sm border print:shadow-none print:border-gray-300 print:p-1.5 print:break-inside-avoid">
      <h3 className="text-sm font-black mb-3 text-center themed-text print:text-[10px] print:mb-1">{format(month, 'MMMM yyyy')}</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-[8px] mb-2 themed-text-muted font-black uppercase tracking-widest print:gap-0.5 print:mb-1">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>
      <div className="grid grid-cols-7 gap-1 print:gap-0.5">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, month);
          const isSuggestedLeave = leaveDates.includes(dateStr);
          const isManualPaid = manualPaidDays.includes(dateStr);
          const isSick = manualSickDays.includes(dateStr);
          const isManualHoliday = manualHolidays.find(mh => mh.date === dateStr);
          const isRemoved = removedHolidays.includes(dateStr);
          const rawHolidayName = holidayMap[dateStr];
          const holidayName = isManualHoliday ? isManualHoliday.name : rawHolidayName;
          const isHoliday = !!holidayName;
          const isActiveHoliday = isHoliday && !isRemoved;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const _isToday = isToday(day);

          let bgColor = "themed-card";
          let textColor = "themed-text";
          let border = "";
          let cursor = "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700";

          if (!isCurrentMonth) {
            textColor = "themed-text-muted opacity-20";
            cursor = "cursor-default";
          } else if (isManualPaid) {
            bgColor = "bg-green-700";
            textColor = "text-white";
          } else if (isSuggestedLeave) {
            bgColor = "bg-green-500";
            textColor = "text-white";
          } else if (isSick) {
            bgColor = "bg-orange-500";
            textColor = "text-white";
          } else if (isActiveHoliday) {
            bgColor = "bg-blue-500";
            textColor = "text-white";
          } else if (isRemoved) {
            bgColor = "themed-input opacity-50";
            textColor = "themed-text-muted";
            cursor = "cursor-pointer hover:opacity-100 transition-opacity";
          } else if (isWeekend) {
            bgColor = "themed-input opacity-30";
            textColor = "themed-text-muted";
            cursor = "cursor-default";
          }
          
          if (_isToday && isCurrentMonth) border = "ring-2 ring-yellow-400 ring-inset";

          return (
            <div 
              key={day.toISOString()} 
              onClick={() => isCurrentMonth && onDayClick(dateStr, isHoliday, isWeekend)}
              title={holidayName || ""}
              className={`h-8 flex items-center justify-center rounded-md ${bgColor} ${textColor} ${border} ${cursor} print:h-5 print:text-[7px] transition-all duration-200 group relative`}
            >
              <span className="text-[10px] font-bold print:text-[7px]">{format(day, 'd')}</span>
              {holidayName && isCurrentMonth && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black dark:bg-white text-white dark:text-black text-[8px] p-1 rounded z-10 whitespace-nowrap px-2 font-bold uppercase tracking-tighter">
                  {holidayName} {isRemoved ? "(REMOVED)" : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TodayIcon = () => {
  const date = new Date();
  return (
    <div className="inline-flex flex-col items-center justify-center themed-card border-2 border-red-500 rounded-lg overflow-hidden w-10 h-10 mr-3 shadow-sm transform -rotate-3">
      <div className="bg-red-500 text-white text-[8px] font-black w-full text-center py-0.5 leading-none uppercase tracking-tighter">
        {format(date, 'MMM')}
      </div>
      <div className="themed-text text-lg font-black leading-none py-0.5">
        {format(date, 'd')}
      </div>
    </div>
  );
};

const PowerSlider = ({ label, value, onChange, colorClass, id }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <label className="text-[9px] font-black themed-text-muted uppercase tracking-widest">{label}: {value.toFixed(1)}</label>
    </div>
    <input 
      type="range" min="0" max="5" step="0.1" list={id}
      value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer ${colorClass}`}
    />
    <datalist id={id}>
      {[0, 1, 2, 3, 4, 5].map(v => <option key={v} value={v} />)}
    </datalist>
    <div className="flex justify-between text-[8px] font-black themed-text-muted opacity-30 px-1 tracking-widest">
      <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
    </div>
  </div>
);

const DPGridView = ({ grid, dates, choices }) => {
  if (!grid || !dates) return <div className="p-8 text-center text-gray-400">Run optimization to see DP grid.</div>;
  const B = grid[0].length - 1;
  
  const maxVal = useMemo(() => {
    let max = 0;
    grid.forEach(row => row.forEach(val => { if (val > max) max = val; }));
    return max || 1;
  }, [grid]);

  // Track the actual chosen path from the currently selected strategy
  const optimalPath = useMemo(() => {
    const path = new Set();
    if (!plannedStrategy || plannedStrategy.length === 0) return path;
    
    // The path consists of (day_index, budget_remaining)
    let curr_b = B;
    const dateToIndex = dates.reduce((acc, d, i) => { acc[d] = i; return acc; }, {});
    
    // Initial state
    path.add(`0-${B}`);
    
    let currentBudget = B;
    plannedStrategy.forEach(block => {
      const startIdx = dateToIndex[block.start_date];
      // All days from previous block end up to this block start are "Stay" decisions
      // But we can simplify: just highlight the state at the start of each block
      path.add(`${startIdx}-${currentBudget}`);
      currentBudget -= block.leave_spent;
    });
    
    return path;
  }, [plannedStrategy, dates, B]);

  return (
    <div className="themed-card rounded-3xl shadow-xl overflow-hidden border flex flex-col h-[80vh] transition-colors duration-300">
      <div className="p-4 bg-gray-900 dark:bg-black text-white flex justify-between items-center">
        <h3 className="text-[9px] font-black uppercase tracking-widest">Utility Heatmap (DP Grid)</h3>
        <div className="text-[8px] font-black opacity-50 uppercase tracking-tighter text-gray-400">Higher intensity = Better value for budget</div>
      </div>
      
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h4 className="text-[10px] font-black uppercase mb-1 dark:text-blue-400 text-blue-900">Optimal Path Legend</h4>
          <p className="text-[9px] text-blue-800 dark:text-blue-300 leading-tight"><b>↑ Stay:</b> Choice for this state.<br/><b>↗ Leave:</b> Choice for this state.</p>
        </div>
        <div className="md:col-span-2">
          <h4 className="text-[10px] font-black uppercase mb-1 dark:text-blue-400 text-blue-900">The Heatmap</h4>
          <p className="text-[9px] text-blue-800 dark:text-blue-300 leading-tight">Cells with <span className="ring-2 ring-yellow-400 px-1 rounded-sm mx-1">Yellow Rings</span> indicate the specific decisions the algorithm took to generate your current plan.</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto font-mono text-[9px]">
        <table className="w-full border-collapse table-fixed">
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-20">
            <tr>
              <th className="p-2 border dark:border-gray-700 bg-gray-200 dark:bg-gray-800 w-24 sticky left-0 z-30">Date \ B</th>
              {Array.from({ length: B + 1 }, (_, b) => (
                <th key={b} className="p-2 border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 w-12 text-[8px] text-center">{b}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((date, i) => (
              <tr key={date}>
                <td className="p-2 border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-bold sticky left-0 z-10 text-[8px] whitespace-nowrap themed-text">{date}</td>
                {grid[i].map((val, b) => {
                  const intensity = val > 0 ? (val / maxVal) : 0;
                  const backgroundColor = val > 0 ? `rgba(34, 197, 94, ${0.1 + intensity * 0.8})` : 'transparent';
                  const textColor = intensity > 0.6 ? 'white' : 'inherit';
                  
                  const isOptimal = optimalPath.has(`${i}-${b}`);
                  const choice = choices && choices[i] && choices[i][b];
                  let arrow = "";
                  if (choice) {
                    const [next_i, cost, block] = choice;
                    arrow = block ? "↗" : "↑";
                  }

                  return (
                    <td 
                      key={b} 
                      style={{ backgroundColor, color: textColor }}
                      className={`p-2 border dark:border-gray-700 transition-colors duration-300 relative ${val === -1 ? 'text-gray-100 dark:text-gray-800' : ''} ${isOptimal ? 'ring-2 ring-yellow-400 ring-inset z-10' : ''}`}
                    >
                      <div className="flex flex-col items-center justify-center text-center leading-none">
                        <span className="text-[9px] font-black mb-0.5">{arrow}</span>
                        <span className="w-full">{val === -1 ? '-' : val.toFixed(1)}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function App() {
  const [country, setCountry] = useState('US');
  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [leaveCount, setLeaveCount] = useState(15);
  const [sickBudget, setSickBudget] = useState(5);
  const [numPower, setNumPower] = useState(1.0);
  const denPower = 1.0;
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [manualSickDays, setManualSickDays] = useState([]);
  const [manualPaidDays, setManualPaidDays] = useState([]);
  const [manualHolidays, setManualHolidays] = useState([]);
  const [removedHolidays, setRemovedHolidays] = useState([]);
  const [selectionMode, setSelectionMode] = useState('sick'); 
  
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [plannedStrategy, setPlannedStrategy] = useState([]);
  const [allStrategies, setAllStrategies] = useState([]);
  const [selectedStrategyIndex, setSelectedStrategyIndex] = useState(-1);
  const [dpGrid, setDpGrid] = useState(null);
  const [calDates, setCalDates] = useState([]);
  const [choices, setChoices] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('http://localhost:8000/countries');
        setCountries(response.data);
      } catch (error) { console.error(error); }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [provRes, holRes] = await Promise.all([
          axios.get(`http://localhost:8000/provinces/${year}/${country}`),
          axios.get(`http://localhost:8000/holidays/${year}/${country}${selectedProvince ? `?province=${selectedProvince}` : ''}`)
        ]);
        setProvinces(provRes.data);
        setHolidays(holRes.data);
      } catch (error) { console.error("Data fetch error", error); }
    };
    if (country) fetchData();
  }, [country, year, selectedProvince]);

  useEffect(() => {
    if (plannedStrategy.length > 0) {
      handleOptimize();
    }
  }, [numPower, denPower]);

  const handleDayClick = (dateStr, isHoliday, isWeekend) => {
    if (isWeekend) return;
    if (selectionMode === 'holiday') {
      if (isHoliday && !manualHolidays.some(mh => mh.date === dateStr)) {
        // Toggle removing an API holiday
        setRemovedHolidays(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
      } else {
        // Toggle a manual holiday
        if (manualHolidays.some(mh => mh.date === dateStr)) {
          setManualHolidays(prev => prev.filter(mh => mh.date !== dateStr));
        } else {
          const name = prompt("Enter holiday name:", "Manual Holiday");
          if (name !== null) {
            setManualHolidays(prev => [...prev, { date: dateStr, name: name || "Manual Holiday" }]);
            setRemovedHolidays(prev => prev.filter(d => d !== dateStr));
          }
        }
      }
      setManualSickDays(prev => prev.filter(d => d !== dateStr));
      setManualPaidDays(prev => prev.filter(d => d !== dateStr));
      return;
    }
    
    // Don't allow marking sick/paid on a holiday UNLESS it's been removed
    const isManual = manualHolidays.some(mh => mh.date === dateStr);
    const isActiveHoliday = (isHoliday && !removedHolidays.includes(dateStr)) || isManual;
    if (isActiveHoliday) return;

    if (selectionMode === 'sick') {
      setManualSickDays(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : (prev.length < sickBudget ? [...prev, dateStr] : prev));
      setManualPaidDays(prev => prev.filter(d => d !== dateStr));
      setManualHolidays(prev => prev.filter(mh => mh.date !== dateStr));
    } else if (selectionMode === 'paid') {
      setManualPaidDays(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : (prev.length < leaveCount ? [...prev, dateStr] : prev));
      setManualSickDays(prev => prev.filter(d => d !== dateStr));
      setManualHolidays(prev => prev.filter(mh => mh.date !== dateStr));
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/optimize', {
        country, province: selectedProvince || null, leave_count: leaveCount, year,
        manual_sick_days: manualSickDays, manual_paid_days: manualPaidDays,
        manual_public_holidays: manualHolidays,
        removed_public_holidays: removedHolidays,
        numerator_power: numPower, denominator_power: denPower
      });
      const strats = response.data.strategies || [];
      setAllStrategies(strats);
      setDpGrid(response.data.dp_grid);
      setCalDates(response.data.calendar);
      setChoices(response.data.choices);
      // Force index update to trigger useEffect even if it was 0
      setSelectedStrategyIndex(-1); 
      setTimeout(() => setSelectedStrategyIndex(0), 0);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => {
    console.log("Selected Strategy Index Changed:", selectedStrategyIndex);
    if (allStrategies.length > 0) {
      setPlannedStrategy(allStrategies[selectedStrategyIndex]);
    } else {
      setPlannedStrategy([]);
    }
  }, [selectedStrategyIndex, allStrategies]);

  const { allLeaveDates, totalDaysOff, overallEfficiency } = useMemo(() => {
    console.log("Calculating allLeaveDates for plannedStrategy:", plannedStrategy);
    const suggestedLeaves = new Set();
    if (Array.isArray(plannedStrategy)) {
      plannedStrategy.forEach(p => p.leave_dates.forEach(d => suggestedLeaves.add(d)));
    }
    console.log("Found suggestedLeaves count:", suggestedLeaves.size);
    const manualLeaves = new Set(manualPaidDays);
    const sickDays = new Set(manualSickDays);
    const holidayDates = new Set([
      ...holidays.map(h => h.date).filter(d => !removedHolidays.includes(d)), 
      ...manualHolidays.map(mh => mh.date)
    ]);
    const allUserOff = new Set([...suggestedLeaves, ...manualLeaves, ...sickDays]);
    
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });
    
    const isDayOff = (date) => {
      const dStr = format(date, 'yyyy-MM-dd');
      return date.getDay() === 0 || date.getDay() === 6 || holidayDates.has(dStr) || allUserOff.has(dStr);
    };

    const blocks = [];
    let currentBlock = [];
    allDays.forEach(day => {
      if (isDayOff(day)) { currentBlock.push(format(day, 'yyyy-MM-dd')); }
      else { if (currentBlock.length > 0) { blocks.push(currentBlock); currentBlock = []; } }
    });
    if (currentBlock.length > 0) blocks.push(currentBlock);

    const activeBlocks = blocks.filter(block => block.some(dateStr => allUserOff.has(dateStr)));
    const totalOff = activeBlocks.reduce((sum, b) => sum + b.length, 0);
    const totalPaidSpent = suggestedLeaves.size + manualLeaves.size;
    const efficiency = totalPaidSpent > 0 ? (totalOff / totalPaidSpent).toFixed(2) : "0.00";

    return { allLeaveDates: Array.from(new Set([...suggestedLeaves, ...manualLeaves])), totalDaysOff: totalOff, overallEfficiency: efficiency };
  }, [plannedStrategy, manualPaidDays, manualSickDays, manualHolidays, holidays, year]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} themed-text p-4 md:p-8 text-sm font-bold print:bg-white print:p-0 antialiased print-container transition-colors duration-300`}>
      <div className="max-w-[1600px] mx-auto print:max-w-none">
        
        {/* Print-only Header */}
        <div className="hidden print:flex justify-between items-end mb-6 pb-4 border-b-2 border-gray-200 print:border-gray-300">
          <div>
            <h1 className="text-3xl font-black tracking-tight print:text-black">{year} Leave Strategy</h1>
            <p className="themed-text-muted uppercase tracking-widest text-[10px] mt-1 print:text-gray-600">{country} • {selectedProvince || 'All Regions'}</p>
          </div>
          <div className="flex gap-6 text-right">
            <div title="Total length of vacation blocks triggered by your leave. Isolated weekends or holidays without adjacent leave days are NOT counted.">
              <p className="text-2xl font-black text-blue-600">{totalDaysOff}</p>
              <p className="text-[8px] uppercase font-black text-gray-400 tracking-widest">Days in Contiguous Blocks</p>
            </div>
            <div title="How much each day of paid leave contributes to the total size of your contiguous blocks. (Days in Blocks / Paid Leave Spent)">
              <p className="text-2xl font-black text-green-600">{overallEfficiency}x</p>
              <p className="text-[8px] uppercase font-black text-gray-400 tracking-widest">Efficiency</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 print:hidden">
          <h1 className="text-3xl font-black tracking-tight flex items-center"><TodayIcon /> Leave Optimizer</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDarkMode(prev => !prev)} 
              className="p-2.5 rounded-xl themed-card border-2 hover:border-blue-500 transition-all shadow-sm active:scale-95"
              title="Toggle Dark Mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={() => window.print()} className="bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-2 rounded-xl font-black hover:bg-black dark:hover:bg-gray-200 transition-all shadow-md active:scale-95 text-[10px] uppercase tracking-widest">Print Plan</button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          <div className="w-full md:w-[320px] lg:w-[380px] md:sticky md:top-6 z-20 print:hidden">
            <div className="themed-card rounded-3xl shadow-xl p-6 border space-y-8 transition-colors duration-300">
              
              <div className="space-y-4">
                <h3 className="text-[9px] font-black themed-text-muted uppercase tracking-widest border-b pb-2">1. Region & Budgets</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <select value={country} onChange={(e) => {setCountry(e.target.value); setSelectedProvince('');}} className="w-full border-2 themed-input p-2.5 rounded-xl focus:border-blue-500 transition-all outline-none text-sm font-black shadow-sm appearance-none">
                      <option value="">Select Country</option>
                      {countries.map(c => <option key={c.countryCode} value={c.countryCode}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} className="w-full border-2 themed-input p-2.5 rounded-xl focus:border-blue-500 transition-all outline-none text-sm font-black shadow-sm appearance-none">
                      <option value="">All Regions</option>
                      {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black themed-text-muted uppercase ml-1 block">Paid</label>
                    <input type="number" value={leaveCount} onChange={(e) => setLeaveCount(parseInt(e.target.value))} className="w-full border-2 themed-input p-2.5 rounded-xl outline-none text-sm font-black shadow-sm" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black themed-text-muted uppercase ml-1 block">Sick</label>
                    <input type="number" value={sickBudget} onChange={(e) => setSickBudget(parseInt(e.target.value))} className="w-full border-2 themed-input p-2.5 rounded-xl outline-none text-sm font-black shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-6 bg-gray-50 themed-card p-4 rounded-2xl border-2 border-dashed transition-colors duration-300">
                <h3 className="text-[9px] font-black themed-text-muted uppercase tracking-widest">2. Tuning</h3>
                <PowerSlider label="Length Bias" value={numPower} onChange={setNumPower} colorClass="accent-blue-600" id="num-marks" />
                
                <div className="bg-blue-900 dark:bg-blue-950 text-white p-4 rounded-2xl shadow-xl border border-blue-800 dark:border-blue-900">
                  <div className="font-mono text-center mb-3">
                    <div className="flex flex-col items-center">
                      <div className="text-[10px] font-black flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <div className="border-b border-blue-400 px-2">Length</div>
                          <div>Cost + 1</div>
                        </div>
                        <span className="text-blue-400">+</span>
                        <div className="flex items-center gap-0.5">
                          <span>L</span>
                          <span className="text-[10px] text-blue-300"><sup>{(1 + numPower/5).toFixed(1)}</sup></span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[7px] leading-relaxed opacity-50 text-center font-black uppercase tracking-widest">Score = Efficiency + Power Bonus</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[9px] font-black themed-text-muted uppercase tracking-widest border-b pb-2">3. Controls</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectionMode('sick')} className={`flex-1 py-2 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest ${selectionMode === 'sick' ? 'bg-orange-500 text-white shadow-md' : 'themed-card themed-text-muted border'}`}>SICK ({manualSickDays.length})</button>
                  <button onClick={() => setSelectionMode('paid')} className={`flex-1 py-2 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest ${selectionMode === 'paid' ? 'bg-green-700 text-white shadow-lg' : 'themed-card themed-text-muted border'}`}>PAID ({manualPaidDays.length})</button>
                  <button onClick={() => setSelectionMode('holiday')} className={`flex-1 py-2 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest ${selectionMode === 'holiday' ? 'bg-blue-500 text-white shadow-lg' : 'themed-card themed-text-muted border'}`}>HOL</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {setPlannedStrategy([]); setDpGrid(null); setRemovedHolidays([]);}} className="flex-1 bg-red-500 text-white font-black py-3 rounded-xl hover:bg-red-600 transition-all text-xs uppercase shadow-md active:scale-95 tracking-widest">CLEAR</button>
                  <button onClick={handleOptimize} disabled={loading} className="flex-[2] bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 transition-all text-xs shadow-md uppercase active:scale-95 tracking-widest">{loading ? '...' : 'OPTIMIZE'}</button>
                </div>
                <button 
                  onClick={() => setShowDebug(!showDebug)} 
                  className={`w-full py-2 rounded-xl text-[8px] font-black transition-all uppercase tracking-[0.2em] border-2 ${showDebug ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-transparent themed-text-muted border hover:border-gray-200 transition-all'}`}
                >
                  {showDebug ? 'VIEW CALENDAR' : 'DEBUG DP GRID'}
                </button>
              </div>

              <div className="pt-4 border-t flex justify-between items-center px-2">
                <div className="text-center cursor-help" title="Total length of vacation blocks triggered by your leave. Isolated weekends or holidays without adjacent leave days are NOT counted.">
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalDaysOff}</p>
                  <p className="text-[8px] uppercase font-black themed-text-muted tracking-widest">Days in Contiguous Blocks</p>
                </div>
                <div className="h-8 w-px bg-gray-100 dark:bg-gray-800"></div>
                <div className="text-center cursor-help" title="How much each day of paid leave contributes to the total size of your contiguous blocks. (Days in Blocks / Paid Leave Spent)">
                  <p className="text-2xl font-black text-green-600 dark:text-green-400">{overallEfficiency}x</p>
                  <p className="text-[8px] uppercase font-black themed-text-muted tracking-widest">Efficiency</p>
                </div>
              </div>

            </div>
          </div>

          <div className="flex-1 w-full space-y-8">
            {!showDebug ? (
              <>
                <div className="flex flex-wrap gap-4 mb-2 text-[8px] font-black uppercase tracking-widest print:mb-6 justify-center lg:justify-start themed-text-muted">
                  <div className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></span> Holiday</div>
                  <div className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-sm mr-2"></span> Suggested</div>
                  <div className="flex items-center"><span className="w-3 h-3 bg-green-700 rounded-sm mr-2"></span> Manual Paid</div>
                  <div className="flex items-center"><span className="w-3 h-3 bg-orange-500 rounded-sm mr-2"></span> Manual Sick</div>
                  <div className="flex items-center"><span className="w-3 h-3 themed-input border rounded-sm mr-2"></span> Removed Holiday</div>
                  <div className="flex items-center"><span className="w-3 h-3 bg-gray-50 dark:bg-gray-900 border rounded-sm mr-2"></span> Weekend</div>

                  <div className="flex items-center print:hidden"><span className="w-3 h-3 ring-2 ring-yellow-400 rounded-sm mr-2"></span> Today</div>
                </div>
                
                <Calendar 
                  year={year} 
                  leaveDates={allLeaveDates} 
                  manualSickDays={manualSickDays} 
                  manualPaidDays={manualPaidDays} 
                  manualHolidays={manualHolidays}
                  removedHolidays={removedHolidays}
                  holidays={holidays} 
                  onDayClick={handleDayClick} 
                />

              </>
            ) : (
              <DPGridView grid={dpGrid} dates={calDates} choices={choices} plannedStrategy={plannedStrategy} />
            )}
          </div>

          {/* Multiple Solutions Selector */}
          {allStrategies.length > 1 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 themed-card p-2 rounded-2xl shadow-2xl border-2 border-blue-500 z-50 animate-bounce-subtle print:hidden">
              <span className="text-[9px] font-black uppercase self-center px-3 themed-text-muted">Solutions:</span>
              {allStrategies.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedStrategyIndex(idx)}
                  className={`w-8 h-8 rounded-xl font-black text-xs transition-all ${selectedStrategyIndex === idx ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-gray-100 dark:bg-gray-800 themed-text hover:bg-gray-200'}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;
