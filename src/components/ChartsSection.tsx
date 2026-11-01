import React, { useState } from 'react';
import { MonthlyRecord } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { formatMonthLabel, getCurrentYearMonth } from '../utils/dateFilters';

interface ChartsSectionProps {
  monthlyData: MonthlyRecord[];
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ monthlyData }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredDonutSlice, setHoveredDonutSlice] = useState<string | null>(null);

  // We show up to 10 months for comfortable readability in timeline
  const displayMonths = monthlyData.slice(0, 10);

  // Calculate values
  const commitments = displayMonths.map(m => m.car + m.home + m.gas + m.tamara + m.tabby);
  const netBalances = displayMonths.map(m => m.salary - (m.car + m.home + m.gas + m.tamara + m.tabby));

  // Timeline SVG dimensions
  const width = 640;
  const height = 240;
  const paddingX = 40;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingTop - paddingBottom;

  const minVal = Math.min(...netBalances, 0);
  const maxVal = Math.max(...commitments, ...netBalances, 1000);
  const range = maxVal > minVal ? maxVal - minVal : 1000;

  const getX = (idx: number) => paddingX + (displayMonths.length > 1 ? (idx / (displayMonths.length - 1)) * chartW : 0);
  const getY = (val: number) => paddingTop + chartH - ((val - minVal) / range) * chartH;
  const zeroY = getY(0);

  // Build SVG path
  const commitPath = commitments.reduce((acc, val, i) => {
    const x = getX(i);
    const y = getY(val);
    return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
  }, '');

  const netPath = netBalances.reduce((acc, val, i) => {
    const x = getX(i);
    const y = getY(val);
    return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
  }, '');

  // Current month breakdown for Donut Chart
  const curr = monthlyData[0] || { month: formatMonthLabel(getCurrentYearMonth()), car: 0, tamara: 0, tabby: 0, gas: 0, home: 0 };
  const donutItems = [
    { label: 'تمارا (Tamara)', value: curr.tamara, color: '#f43f5e', fill: 'fill-rose-500' },
    { label: 'السيارة', value: curr.car, color: '#3b82f6', fill: 'fill-blue-500' },
    { label: 'بنزين', value: curr.gas, color: '#f59e0b', fill: 'fill-amber-500' },
    { label: 'السكن', value: curr.home, color: '#64748b', fill: 'fill-slate-500' },
    { label: 'تابي (Tabby)', value: curr.tabby, color: '#10b981', fill: 'fill-emerald-500' }
  ];

  const totalDonut = donutItems.reduce((acc, item) => acc + item.value, 0);

  // SVG Donut calculation
  const donutRadius = 65;
  const donutThickness = 22;
  const circumference = 2 * Math.PI * donutRadius;
  let accumulatedOffset = 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Main Timeline Chart */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-bold text-base text-slate-900">مسار انخفاض الأقساط ونمو الصافي المتاح</h2>
            <p className="text-xs text-slate-500 mt-0.5">رؤية حية لتطور التزاماتك شهرياً حتى إبريل 2027 وما بعده</p>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500"></span>
              <span className="text-slate-600">إجمالي الالتزامات</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
              <span className="text-slate-600">الصافي المتاح (Net)</span>
            </div>
          </div>
        </div>

        {/* SVG Line chart */}
        <div className="relative w-full h-64 sm:h-72 select-none">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            {/* Horizontal Grid lines */}
            {[0, 2000, 4000, 6000].map((val) => {
              const y = getY(val);
              return (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={val === 0 ? '4 2' : 'none'}
                  />
                  <text
                    x={width - paddingX + 5}
                    y={y + 3}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="inherit"
                    textAnchor="start"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Zero Axis Line */}
            {minVal < 0 && (
              <line
                x1={paddingX}
                y1={zeroY}
                x2={width - paddingX}
                y2={zeroY}
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Commitments Line */}
            <path
              d={commitPath}
              fill="none"
              stroke="#e11d48"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Net Balance Line */}
            <path
              d={netPath}
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {displayMonths.map((m, i) => {
              const x = getX(i);
              const commitY = getY(commitments[i]);
              const netY = getY(netBalances[i]);
              const isHovered = hoveredIndex === i;

              return (
                <g key={m.id} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                  {/* Vertical hover guide */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={height - paddingBottom}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Commitment dot */}
                  <circle
                    cx={x}
                    cy={commitY}
                    r={isHovered ? 5.5 : 4}
                    fill="#ffffff"
                    stroke="#e11d48"
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all cursor-pointer"
                  />

                  {/* Net dot */}
                  <circle
                    cx={x}
                    cy={netY}
                    r={isHovered ? 5.5 : 4}
                    fill="#ffffff"
                    stroke="#059669"
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all cursor-pointer"
                  />

                  {/* Month label on X axis */}
                  <text
                    x={x}
                    y={height - paddingBottom + 18}
                    fill={isHovered ? '#0f172a' : '#64748b'}
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="inherit"
                  >
                    {m.month}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredIndex !== null && (
            <div 
              className="absolute top-2 left-4 bg-slate-900/90 text-white backdrop-blur-xs text-xs p-3 rounded-xl shadow-lg pointer-events-none transition-all z-10 border border-slate-700 max-w-xs"
            >
              <div className="font-bold text-slate-100 mb-1 flex items-center justify-between border-b border-slate-700 pb-1">
                <span>{displayMonths[hoveredIndex].month}</span>
                <span className="text-[10px] text-slate-300">الراتب: <span className="num-ltr font-mono">{formatCurrency(displayMonths[hoveredIndex].salary)}</span> ر.س</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between gap-4 text-rose-300">
                  <span>الالتزامات:</span>
                  <span className="font-mono font-bold num-ltr">{formatCurrency(commitments[hoveredIndex])} ر.س</span>
                </div>
                <div className="flex justify-between gap-4 text-emerald-300">
                  <span>الصافي المتاح:</span>
                  <span className="font-mono font-bold num-ltr">{formatCurrency(netBalances[hoveredIndex])} ر.س</span>
                </div>
                {displayMonths[hoveredIndex].note && (
                  <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-700/60 mt-1 italic">
                    {displayMonths[hoveredIndex].note}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-600 mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
          <span>* لاحظ القفزة الإيجابية في إبريل 2027 عند هبوط أقساط تمارا وتابي إلى الصفر!</span>
          <span className="text-emerald-700 font-medium">هدف استراتيجي 🎯</span>
        </div>
      </div>

      {/* 2. Breakdown Donut Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900">توزيع التزامات {curr.month || 'أكتوبر'}</h2>
            <span className="text-xs text-slate-600 font-mono font-bold num-ltr">{formatCurrency(totalDonut)} <span className="font-sans text-xs">ر.س</span></span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">أين يذهب الراتب بالتحديد؟</p>
        </div>

        {/* Donut Chart Visualization */}
        <div className="my-auto py-2 flex flex-col items-center justify-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 transform">
              {totalDonut === 0 ? (
                <circle
                  cx="80"
                  cy="80"
                  r={donutRadius}
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth={donutThickness}
                />
              ) : (
                donutItems.map((item) => {
                  const sliceRatio = totalDonut > 0 ? item.value / totalDonut : 0;
                  const strokeDasharray = `${sliceRatio * circumference} ${circumference}`;
                  const strokeDashoffset = isNaN(accumulatedOffset) ? 0 : -accumulatedOffset;
                  accumulatedOffset += sliceRatio * circumference;

                  const isHovered = hoveredDonutSlice === item.label;

                  return (
                    <circle
                      key={item.label}
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth={isHovered ? donutThickness + 4 : donutThickness}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredDonutSlice(item.label)}
                      onMouseLeave={() => setHoveredDonutSlice(null)}
                    />
                  );
                })
              )}
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xs text-slate-500">تمارا والأقساط</span>
              <span className="text-lg font-bold text-slate-900 font-mono num-ltr">
                {totalDonut > 0 ? Math.round(((curr.tamara + curr.tabby) / totalDonut) * 100) : 0}%
              </span>
              <span className="text-[10px] text-rose-500 font-medium">أعلى بند استنزاف</span>
            </div>
          </div>
        </div>

        {/* Legend list */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
          {donutItems.map((item) => {
            const pct = totalDonut > 0 ? Math.round((item.value / totalDonut) * 100) : 0;
            return (
              <div 
                key={item.label} 
                onMouseEnter={() => setHoveredDonutSlice(item.label)}
                onMouseLeave={() => setHoveredDonutSlice(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition ${
                  hoveredDonutSlice === item.label ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate text-slate-700">{item.label}</span>
                </div>
                <span className="font-mono text-slate-500 shrink-0 num-ltr">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
