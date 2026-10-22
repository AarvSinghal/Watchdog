import React, { useState } from 'react';
import {
  ArrowLeft,
  Play,
  ExternalLink,
  Table,
  LineChart as ChartIcon,
  ShieldAlert,
  History,
  Edit3,
  Calendar,
  Download,
  Copy,
  Check,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { AlertRule, FrequencyType, PricePoint, RunRecord, TemplateType, Watch, WatchItem } from '../types';
import { TEMPLATES } from '../services/schemas';
import { RelevanceBadge } from '../components/RelevanceBadge';
import { itemMatchesRules, parseAnyDate } from '../services/diffEngine';
import { buildGoogleCalendarUrl, downloadIcsFile, generateIcsCalendar } from '../services/icsGenerator';

interface WatchDetailPageProps {
  watch: Watch;
  onBack: () => void;
  onCheckNow: (watch: Watch) => void;
  onUpdateWatch: (updated: Watch) => void;
  currencySymbol: string;
  isChecking?: boolean;
}

export const WatchDetailPage: React.FC<WatchDetailPageProps> = ({
  watch,
  onBack,
  onCheckNow,
  onUpdateWatch,
  currencySymbol,
  isChecking,
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'price' | 'rules' | 'runs' | 'edit'>('data');
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [sortByFit, setSortByFit] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState(watch.name);
  const [editUrl, setEditUrl] = useState(watch.url);
  const [editGoal, setEditGoal] = useState(watch.goal);
  const [editTemplate, setEditTemplate] = useState<TemplateType>(watch.template);
  const [editFrequency, setEditFrequency] = useState<FrequencyType>(watch.frequency);
  const [editStealth, setEditStealth] = useState(watch.stealth);
  const [editRules, setEditRules] = useState<AlertRule[]>(watch.rules || []);
  const [editMsg, setEditMsg] = useState('');

  const templateMeta = TEMPLATES[watch.template] || TEMPLATES.custom;
  const items = watch.snapshot?.items || [];

  // Sort items if sort by fit is enabled
  const displayedItems = [...items].sort((a, b) => {
    if (!sortByFit) return 0;
    const keyA = a.title || a.name || '';
    const keyB = b.title || b.name || '';
    const scoreA = watch.snapshot?.scores?.[keyA]?.score || 0;
    const scoreB = watch.snapshot?.scores?.[keyB]?.score || 0;
    return scoreB - scoreA;
  });

  // Price history calculations
  const priceHistoryMap = watch.priceHistory || {};
  const productKeys = Object.keys(priceHistoryMap);
  const activeProductKey = selectedProduct || productKeys[0] || '';
  const activePricePoints: PricePoint[] = priceHistoryMap[activeProductKey] || [];

  // Find lowest and highest price
  let currentPrice: number | null = null;
  let lowestPrice: number | null = null;
  let lowestDateStr: string = '';
  let highestPrice: number | null = null;
  let pctChange: number | null = null;

  if (activePricePoints.length > 0) {
    currentPrice = activePricePoints[activePricePoints.length - 1].price;
    lowestPrice = Math.min(...activePricePoints.map((p) => p.price));
    highestPrice = Math.max(...activePricePoints.map((p) => p.price));
    const lowestPoint = activePricePoints.find((p) => p.price === lowestPrice);
    if (lowestPoint) {
      lowestDateStr = new Date(lowestPoint.time).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
    }

    const firstPrice = activePricePoints[0].price;
    if (firstPrice > 0) {
      pctChange = ((currentPrice - firstPrice) / firstPrice) * 100;
    }
  }

  // Find threshold for price below rule if any
  const priceBelowRule = watch.rules?.find((r) => r.field === 'price' && r.op === 'below');
  const priceThreshold = priceBelowRule ? Number(priceBelowRule.value) : null;

  // CSV generation
  const generateCsv = () => {
    if (items.length === 0) return '';
    const headers = templateMeta.fields.map((f) => f.name);
    const rows = items.map((it) =>
      headers
        .map((h) => {
          const val = it[h] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const handleCopyCsv = () => {
    const csv = generateCsv();
    navigator.clipboard.writeText(csv);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csv = generateCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${watch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Live preview for rule match count
  const matchingItemsCount = items.filter((it) => itemMatchesRules(it, editRules)).length;

  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editUrl.trim() || !editGoal.trim()) {
      setEditMsg('Please fill in all required fields.');
      return;
    }
    const updated: Watch = {
      ...watch,
      name: editName.trim(),
      url: editUrl.trim(),
      goal: editGoal.trim(),
      template: editTemplate,
      frequency: editFrequency,
      stealth: editStealth,
      rules: editRules.slice(0, 3),
    };
    onUpdateWatch(updated);
    setEditMsg('Changes saved successfully!');
    setTimeout(() => setEditMsg(''), 2500);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header with Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E2D8] dark:border-[#24305E]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#475569] dark:text-[#94A3B8] hover:text-[#0E9AA7] transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#0E9AA7] dark:text-[#76E4EC] font-semibold">
                {templateMeta.label}
              </span>
              <span className="text-[#94A3B8]">·</span>
              <a
                href={watch.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#94A3B8] hover:text-[#0E9AA7] flex items-center gap-1 font-mono truncate max-w-xs"
              >
                <span>{watch.url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1E2A5A] dark:text-white mt-0.5">
              {watch.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onCheckNow(watch)}
            disabled={isChecking || watch.status === 'RUNNING'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0E9AA7] hover:bg-[#0B7F8A] text-white disabled:opacity-50 transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isChecking ? 'Checking...' : 'Check now'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E7E2D8] dark:border-[#24305E] overflow-x-auto pb-px">
        {[
          { id: 'data', label: 'Data Items', icon: Table, count: items.length },
          { id: 'price', label: 'Price History', icon: ChartIcon, disabled: watch.template !== 'price' },
          { id: 'rules', label: 'Alert Rules', icon: ShieldAlert, count: watch.rules?.length || 0 },
          { id: 'runs', label: 'Run History', icon: History, count: watch.runs?.length || 0 },
          { id: 'edit', label: 'Edit Configuration', icon: Edit3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              disabled={tab.disabled}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-[#0E9AA7] text-[#0E9AA7] dark:text-[#76E4EC]'
                  : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E2A5A] dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-[#FAF8F4] dark:bg-[#1E2A5A] text-[#94A3B8]">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DATA TABLE */}
      {activeTab === 'data' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#172147] p-3 rounded-2xl border border-[#E7E2D8] dark:border-[#24305E]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#94A3B8]">
                {items.length} {items.length === 1 ? 'item' : 'items'} in snapshot
              </span>
              <label className="flex items-center gap-1.5 text-xs text-[#475569] dark:text-[#94A3B8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={sortByFit}
                  onChange={(e) => setSortByFit(e.target.checked)}
                  className="rounded text-[#0E9AA7] focus:ring-[#0E9AA7]"
                />
                <Sparkles className="w-3.5 h-3.5 text-[#0E9AA7]" />
                <span>Sort by fit score</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCsv}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E7E2D8] dark:border-[#24305E] text-[#475569] dark:text-[#E2E8F0] hover:bg-[#FAF8F4] dark:hover:bg-[#1E2A5A] transition-colors"
              >
                {copiedCsv ? <Check className="w-3.5 h-3.5 text-[#1B8A5A]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCsv ? 'Copied CSV' : 'Copy CSV'}</span>
              </button>
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E7E2D8] dark:border-[#24305E] text-[#475569] dark:text-[#E2E8F0] hover:bg-[#FAF8F4] dark:hover:bg-[#1E2A5A] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .csv</span>
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#172147] rounded-2xl border border-[#E7E2D8] dark:border-[#24305E]">
              <p className="text-sm text-[#94A3B8] italic">
                No data items captured yet. Press &quot;Check now&quot; to run the TinyFish web agent.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#172147] shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F4] dark:bg-[#1A234A] border-b border-[#E7E2D8] dark:border-[#24305E] text-[#1E2A5A] dark:text-[#E2E8F0] font-mono uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Fit</th>
                    {templateMeta.fields.map((f) => (
                      <th key={f.name} className="px-4 py-3">
                        {f.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E2D8]/60 dark:divide-[#24305E]/60 text-[#475569] dark:text-[#CBD5E1]">
                  {displayedItems.map((item, idx) => {
                    const keyVal = item.title || item.name || '';
                    const scoreObj = watch.snapshot?.scores?.[keyVal];
                    const isLowest =
                      watch.template === 'price' &&
                      lowestPrice !== null &&
                      Number(item.price) === lowestPrice;

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-[#FAF8F4]/50 dark:hover:bg-[#1E2A5A]/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <RelevanceBadge scoreObj={scoreObj} />
                        </td>
                        {templateMeta.fields.map((f) => {
                          const val = item[f.name];
                          if (f.name === 'price') {
                            return (
                              <td key={f.name} className="px-4 py-3 font-mono font-bold text-[#1E2A5A] dark:text-white">
                                {currencySymbol}
                                {Number(val).toLocaleString('en-IN')}
                                {isLowest && (
                                  <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#E0EFE8] text-[#1B8A5A] font-sans font-medium">
                                    Lowest
                                  </span>
                                )}
                              </td>
                            );
                          }
                          if (f.name === 'in_stock') {
                            return (
                              <td key={f.name} className="px-4 py-3 font-mono text-[11px]">
                                {val === true ? (
                                  <span className="text-[#1B8A5A] font-semibold">In Stock</span>
                                ) : val === false ? (
                                  <span className="text-[#C0392B]">Out of Stock</span>
                                ) : (
                                  '--'
                                )}
                              </td>
                            );
                          }
                          if (f.type === 'date') {
                            return (
                              <td key={f.name} className="px-4 py-3 font-mono text-[11px]">
                                {val ? String(val) : '--'}
                              </td>
                            );
                          }
                          return (
                            <td key={f.name} className="px-4 py-3 max-w-xs truncate">
                              {val !== null && val !== undefined ? String(val) : '--'}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.deadline && (
                              <button
                                onClick={() => {
                                  const parsed = parseAnyDate(item.deadline);
                                  if (parsed) {
                                    const icsContent = generateIcsCalendar([
                                      {
                                        watchId: watch.id,
                                        watchName: watch.name,
                                        itemTitle: keyVal,
                                        rawDate: item.deadline,
                                        parsedDate: parsed,
                                        link: item.link || watch.url,
                                      },
                                    ]);
                                    downloadIcsFile(`deadline-${keyVal}.ics`, icsContent);
                                  }
                                }}
                                className="p-1 rounded text-[#94A3B8] hover:text-[#0E9AA7] transition-colors"
                                title="Download .ics calendar reminder"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded text-[#94A3B8] hover:text-[#0E9AA7] transition-colors"
                                title="Open item page"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRICE HISTORY CHARTS (F6) */}
      {activeTab === 'price' && (
        <div className="space-y-6">
          {productKeys.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Select Product Variant:
              </label>
              <select
                value={activeProductKey}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white"
              >
                {productKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activePricePoints.length < 2 ? (
            <div className="p-12 text-center bg-white dark:bg-[#172147] rounded-3xl border border-[#E7E2D8] dark:border-[#24305E]">
              <div className="w-16 h-16 rounded-2xl bg-[#CFEDEF]/50 dark:bg-[#0E9AA7]/10 text-[#0E9AA7] mx-auto mb-4 flex items-center justify-center">
                <ChartIcon className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#1E2A5A] dark:text-white mb-1">
                Collecting Price History
              </h3>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                Check again later to see the trend. Watchdog automatically tracks price fluctuations across every check.
              </p>
            </div>
          ) : (
            <>
              {/* Stat Tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#172147] p-4 rounded-2xl border border-[#E7E2D8] dark:border-[#24305E]">
                  <span className="text-xs text-[#94A3B8] uppercase tracking-wider">Current Price</span>
                  <div className="font-display text-2xl font-bold text-[#1E2A5A] dark:text-white mt-1">
                    {currencySymbol}
                    {currentPrice?.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#172147] p-4 rounded-2xl border border-[#E7E2D8] dark:border-[#24305E]">
                  <span className="text-xs text-[#94A3B8] uppercase tracking-wider">Lowest Seen</span>
                  <div className="font-display text-2xl font-bold text-[#1B8A5A] mt-1">
                    {currencySymbol}
                    {lowestPrice?.toLocaleString('en-IN')}
                  </div>
                  {lowestDateStr && (
                    <span className="text-[11px] text-[#94A3B8]">on {lowestDateStr}</span>
                  )}
                </div>

                <div className="bg-white dark:bg-[#172147] p-4 rounded-2xl border border-[#E7E2D8] dark:border-[#24305E]">
                  <span className="text-xs text-[#94A3B8] uppercase tracking-wider">Highest Seen</span>
                  <div className="font-display text-2xl font-bold text-[#C0392B] mt-1">
                    {currencySymbol}
                    {highestPrice?.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#172147] p-4 rounded-2xl border border-[#E7E2D8] dark:border-[#24305E]">
                  <span className="text-xs text-[#94A3B8] uppercase tracking-wider">Change Overall</span>
                  <div
                    className={`font-display text-2xl font-bold mt-1 flex items-center gap-1 ${
                      (pctChange || 0) < 0 ? 'text-[#1B8A5A]' : 'text-[#C0392B]'
                    }`}
                  >
                    {(pctChange || 0) < 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    <span>{pctChange !== null ? `${Math.abs(pctChange).toFixed(1)}%` : '--'}</span>
                  </div>
                </div>
              </div>

              {/* Chart Card */}
              <div className="bg-white dark:bg-[#172147] p-6 rounded-3xl border border-[#E7E2D8] dark:border-[#24305E] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-lg text-[#1E2A5A] dark:text-white">
                    Price Trend for {activeProductKey}
                  </h3>
                  {priceThreshold && (
                    <span className="text-xs font-mono text-[#0E9AA7] bg-[#CFEDEF]/50 dark:bg-[#0E9AA7]/20 px-2.5 py-1 rounded-full">
                      Rule threshold: {currencySymbol}
                      {priceThreshold.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activePricePoints.map((pt) => ({
                        ...pt,
                        dateStr: new Date(pt.time).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                        }),
                      }))}
                    >
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0E9AA7" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0E9AA7" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="dateStr"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        domain={['dataMin - 500', 'dataMax + 500']}
                        tickFormatter={(v) => `${currencySymbol}${Number(v).toLocaleString('en-IN')}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F1733',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`${currencySymbol}${Number(val).toLocaleString('en-IN')}`, 'Price']}
                      />
                      {priceThreshold && (
                        <ReferenceLine
                          y={priceThreshold}
                          stroke="#E8734A"
                          strokeDasharray="4 4"
                          label={{
                            value: 'Alert Threshold',
                            fill: '#E8734A',
                            fontSize: 10,
                            position: 'insideTopLeft',
                          }}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#0E9AA7"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#priceGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: SMART ALERT RULES (F3) */}
      {activeTab === 'rules' && (
        <div className="bg-white dark:bg-[#172147] p-6 rounded-3xl border border-[#E7E2D8] dark:border-[#24305E] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-semibold text-lg text-[#1E2A5A] dark:text-white">
                Configure Smart Alert Rules
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Get notified only when items newly cross these conditions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-[#E0EFE8] text-[#1B8A5A]">
                {matchingItemsCount} of {items.length} items match
              </span>
            </div>
          </div>

          {/* Example Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Quick add:</span>
            <button
              type="button"
              onClick={() => {
                setEditRules([
                  ...editRules.slice(0, 2),
                  { id: `r-${Date.now()}`, field: 'price', op: 'below', value: 60000 },
                ]);
              }}
              className="px-2.5 py-1 rounded-full text-xs bg-[#FAF8F4] dark:bg-[#1E2A5A] border border-[#E7E2D8] dark:border-[#24305E] text-[#475569] dark:text-[#94A3B8]"
            >
              price below 60000
            </button>
            <button
              type="button"
              onClick={() => {
                setEditRules([
                  ...editRules.slice(0, 2),
                  { id: `r-${Date.now()}`, field: 'title', op: 'contains', value: 'Software' },
                ]);
              }}
              className="px-2.5 py-1 rounded-full text-xs bg-[#FAF8F4] dark:bg-[#1E2A5A] border border-[#E7E2D8] dark:border-[#24305E] text-[#475569] dark:text-[#94A3B8]"
            >
              title contains software
            </button>
            <button
              type="button"
              onClick={() => {
                setEditRules([
                  ...editRules.slice(0, 2),
                  { id: `r-${Date.now()}`, field: 'deadline', op: 'within_days', value: 7 },
                ]);
              }}
              className="px-2.5 py-1 rounded-full text-xs bg-[#FAF8F4] dark:bg-[#1E2A5A] border border-[#E7E2D8] dark:border-[#24305E] text-[#475569] dark:text-[#94A3B8]"
            >
              deadline within 7 days
            </button>
          </div>

          {/* Rules List */}
          <div className="space-y-3">
            {editRules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#FAF8F4] dark:bg-[#1E2A5A] border border-[#E7E2D8] dark:border-[#24305E]"
              >
                <select
                  value={rule.field}
                  onChange={(e) =>
                    setEditRules(
                      editRules.map((r) => (r.id === rule.id ? { ...r, field: e.target.value } : r))
                    )
                  }
                  className="px-3 py-1.5 rounded-lg text-xs border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#131B3A] text-[#1E2A5A] dark:text-white"
                >
                  {templateMeta.fields.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <select
                  value={rule.op}
                  onChange={(e) =>
                    setEditRules(
                      editRules.map((r) => (r.id === rule.id ? { ...r, op: e.target.value as any } : r))
                    )
                  }
                  className="px-3 py-1.5 rounded-lg text-xs border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#131B3A] text-[#1E2A5A] dark:text-white"
                >
                  <option value="below">is below (&lt;)</option>
                  <option value="above">is above (&gt;)</option>
                  <option value="contains">contains</option>
                  <option value="does_not_contain">does not contain</option>
                  <option value="equals">equals</option>
                  <option value="within_days">within N days</option>
                  <option value="is_true">is true</option>
                  <option value="is_false">is false</option>
                </select>

                {!['is_true', 'is_false'].includes(rule.op) && (
                  <input
                    type={['below', 'above', 'within_days'].includes(rule.op) ? 'number' : 'text'}
                    value={rule.value}
                    onChange={(e) =>
                      setEditRules(
                        editRules.map((r) => (r.id === rule.id ? { ...r, value: e.target.value } : r))
                      )
                    }
                    className="flex-1 min-w-[120px] px-3 py-1.5 rounded-lg text-xs border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#131B3A] text-[#1E2A5A] dark:text-white"
                    placeholder="Value..."
                  />
                )}

                <button
                  type="button"
                  onClick={() => setEditRules(editRules.filter((r) => r.id !== rule.id))}
                  className="p-1.5 text-[#94A3B8] hover:text-[#C0392B] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {editRules.length < 3 && (
              <button
                type="button"
                onClick={() =>
                  setEditRules([
                    ...editRules,
                    {
                      id: `rule-${Date.now()}`,
                      field: templateMeta.fields[0]?.name || 'title',
                      op: 'contains',
                      value: '',
                    },
                  ])
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0E9AA7] bg-[#CFEDEF]/40 hover:bg-[#CFEDEF] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Condition</span>
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-[#E7E2D8] dark:border-[#24305E] flex justify-end">
            <button
              onClick={() => {
                onUpdateWatch({ ...watch, rules: editRules });
                setEditMsg('Rules updated!');
                setTimeout(() => setEditMsg(''), 2000);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0E9AA7] text-white hover:bg-[#0B7F8A] transition-colors"
            >
              Save Rules
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: RUN HISTORY */}
      {activeTab === 'runs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-lg text-[#1E2A5A] dark:text-white">
              Latest 10 Check Runs
            </h3>
            <span className="text-xs text-[#94A3B8]">Retained in local browser storage</span>
          </div>

          {!watch.runs || watch.runs.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#172147] rounded-2xl border border-[#E7E2D8] dark:border-[#24305E] text-xs text-[#94A3B8]">
              No runs recorded yet. Press Check now to execute.
            </div>
          ) : (
            <div className="space-y-3">
              {watch.runs.map((r) => {
                const isExpanded = expandedRunId === r.id;
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#172147] border border-[#E7E2D8] dark:border-[#24305E] shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            r.status === 'COMPLETED'
                              ? 'bg-[#1B8A5A]'
                              : r.status === 'WARNING'
                              ? 'bg-[#C77700]'
                              : 'bg-[#C0392B]'
                          }`}
                        />
                        <div>
                          <p className="font-semibold text-xs text-[#1E2A5A] dark:text-white">
                            Run at {new Date(r.startedAt).toLocaleString()}
                          </p>
                          <p className="text-[11px] text-[#94A3B8]">
                            Duration: {r.durationSeconds}s · Items: {r.itemCount} · Alerts: {r.newAlertCount}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedRunId(isExpanded ? null : r.id)}
                        className="text-xs text-[#0E9AA7] dark:text-[#76E4EC] flex items-center gap-1 hover:underline"
                      >
                        <span>{isExpanded ? 'Hide steps' : 'View steps'}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-[#E7E2D8] dark:border-[#24305E] space-y-2">
                        <p className="text-[11px] font-mono uppercase tracking-wider text-[#94A3B8]">
                          Executed Agent Steps:
                        </p>
                        {r.steps?.map((st, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-[#FAF8F4] dark:bg-[#1E2A5A]"
                          >
                            <span className="text-[#475569] dark:text-[#CBD5E1]">{st.purpose}</span>
                            <span className="text-[10px] font-mono text-[#94A3B8]">
                              {new Date(st.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: EDIT FORM */}
      {activeTab === 'edit' && (
        <form
          onSubmit={handleSaveEdits}
          className="bg-white dark:bg-[#172147] p-6 rounded-3xl border border-[#E7E2D8] dark:border-[#24305E] space-y-5 shadow-xs"
        >
          {editMsg && (
            <div className="p-3 rounded-xl bg-[#E0EFE8] text-[#1B8A5A] text-xs font-semibold">
              {editMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E2A5A] dark:text-white mb-1.5">
              Tracker Name (1-80 chars)
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E2A5A] dark:text-white mb-1.5">
              URL to Watch
            </label>
            <input
              type="url"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E2A5A] dark:text-white mb-1.5">
                Template
              </label>
              <select
                value={editTemplate}
                onChange={(e) => setEditTemplate(e.target.value as TemplateType)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white"
              >
                <option value="price">Price & Stock Tracker</option>
                <option value="internship">Internship Tracker</option>
                <option value="job">Job Tracker</option>
                <option value="scholarship">Scholarship & Grants</option>
                <option value="custom">Custom Web Watcher</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E2A5A] dark:text-white mb-1.5">
                Frequency
              </label>
              <select
                value={editFrequency}
                onChange={(e) => setEditFrequency(e.target.value as FrequencyType)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white"
              >
                <option value="manual">Manual only</option>
                <option value="hourly">Hourly</option>
                <option value="6h">Every 6 hours</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E2A5A] dark:text-white mb-1.5">
              TinyFish Agent Goal
            </label>
            <textarea
              rows={3}
              value={editGoal}
              onChange={(e) => setEditGoal(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-[#E7E2D8] dark:border-[#24305E] bg-white dark:bg-[#1E2A5A] text-[#1E2A5A] dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E7E2D8] dark:border-[#24305E] bg-[#FAF8F4] dark:bg-[#1E2A5A]">
            <div>
              <p className="text-xs font-semibold text-[#1E2A5A] dark:text-white">Stealth Profile</p>
              <p className="text-[11px] text-[#94A3B8]">Proxy routing through India residential node</p>
            </div>
            <input
              type="checkbox"
              checked={editStealth}
              onChange={(e) => setEditStealth(e.target.checked)}
              className="w-4 h-4 text-[#0E9AA7] rounded"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0E9AA7] text-white hover:bg-[#0B7F8A] transition-colors"
          >
            Update Tracker
          </button>
        </form>
      )}
    </div>
  );
};
