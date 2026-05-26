import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CalendarDays, 
  ListOrdered, 
  CheckSquare, 
  AlertTriangle, 
  ArrowRightLeft, 
  Download,
  Loader2,
  FileText,
  ChevronRight,
  Scale,
  Wrench,
  Eye,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { reportGenerator } from '../../utils/reportGenerator';
import type { Animal, DailyLog, User } from '../../types/schema';

interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const REPORTS: ReportDefinition[] = [
  { id: 'husbandry', title: 'Daily log', description: 'Export daily feeding, cleaning, and observation records.', icon: CalendarDays },
  { id: 'weight', title: 'Weight History', description: 'Historical weight records for all animals.', icon: Scale },
  { id: 'internal_movements', title: 'Internal Movements Ledger', description: 'Log of all internal enclosure changes', icon: ArrowRightLeft },
  { id: 'external_transfers', title: 'External Transfers Ledger', description: 'Log of all acquisitions, loans, transfers, and deaths', icon: ArrowRightLeft },
  { id: 'site_maintenance', title: 'Site Maintenance Ledger', description: 'Log of all site maintenance tasks, repairs, and statuses', icon: Wrench },
  { id: 'census', title: 'Annual Census', description: 'Complete inventory of all animals currently on site.', icon: ListOrdered },
  { id: 'stocklist', title: 'Stock List (Section 9)', description: 'Statutory stocklist showing population changes over time.', icon: ArrowRightLeft },
  { id: 'rounds', title: 'Rounds Checklist', description: 'Verification of completed daily operational rounds.', icon: CheckSquare },
  { id: 'incidents', title: 'Incident Log', description: 'Log of recorded operational and safety incidents.', icon: AlertTriangle },
  { id: 'death_certificate', title: 'Death Certificate', description: 'Generate a formal death certificate for a deceased animal.', icon: FileText },
  { id: 'staff_rota', title: 'Staff Rota Schedule', description: 'Export scheduled staff shifts, times, and coverage areas.', icon: CalendarDays },
  { id: 'inspection_package', title: 'Inspection Package', description: 'Comprehensive package including medical logs, MAR charts, and maintenance logs.', icon: FileText }
];

export function ReportsManager() {
  const [activeReportId, setActiveReportId] = useState('husbandry');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSection, setSelectedSection] = useState<string>('EXOTICS'); 
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [rotaPeriod, setRotaPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  // Strict Offline Caches
  const { data: animals = [] } = useQuery<Animal[]>({ queryKey: ['animals'], queryFn: () => [], staleTime: Infinity });
  const { data: dailyLogs = [] } = useQuery<DailyLog[]>({ queryKey: ['daily_logs'], queryFn: () => [], staleTime: Infinity });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => [], staleTime: Infinity });

  const activeReport = REPORTS.find(r => r.id === activeReportId) || REPORTS[0];
  const archivedAnimals = animals.filter(a => a.archived);
  const uniqueSections = ['OWLS', 'RAPTORS', 'MAMMALS', 'EXOTICS'];

  // Check if the current report has a generator built
  const isImplemented = ['husbandry', 'weight'].includes(activeReportId);

  // Auto-calculate End Date based on Rota Period
  useEffect(() => {
    if (activeReportId === 'staff_rota') {
      const start = new Date(startDate);
      const end = new Date(startDate);
      if (rotaPeriod === 'weekly') end.setDate(start.getDate() + 6);
      else if (rotaPeriod === 'monthly') { end.setMonth(start.getMonth() + 1); end.setDate(end.getDate() - 1); }
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, rotaPeriod, activeReportId]);

  // Reset preview when switching reports
  useEffect(() => { setPreviewData(null); }, [activeReportId]);

  const generatePreview = () => {
    if (!isImplemented) return; // Do nothing if not implemented

    setIsGenerating(true);
    try {
      const categoryAnimalIds = new Set(animals.filter(a => !a.is_deleted && !a.archived && (a.category || '').toUpperCase() === selectedSection).map(a => a.id));

      if (activeReportId === 'husbandry') {
        const filtered = dailyLogs
          .filter(l => !l.is_deleted && categoryAnimalIds.has(l.animal_id) && l.log_date >= startDate && l.log_date <= endDate + 'T23:59:59.999Z')
          .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
        setPreviewData(filtered);
      } else if (activeReportId === 'weight') {
        const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffIso = sevenDaysAgo.toISOString();
        const filtered = dailyLogs.filter(l => !l.is_deleted && l.log_type === 'WEIGHT' && categoryAnimalIds.has(l.animal_id) && l.log_date >= cutoffIso);
        setPreviewData(filtered);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      if (activeReportId === 'weight') {
        await reportGenerator.generateWeeklyWeightsDoc(animals, dailyLogs, selectedSection);
      } else if (activeReportId === 'husbandry') {
        await reportGenerator.generateHusbandryDoc(animals, dailyLogs, users, selectedSection, startDate, endDate);
      }
    } catch (error) {
      console.error("Docx generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderA4Preview = () => {
    // 1. Explicitly check if the report engine is built yet
    if (!isImplemented) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-600">
          <Wrench size={48} className="mb-4 text-amber-500/50" />
          <p className="text-sm font-black uppercase tracking-widest text-amber-500">Preview Engine Pending</p>
          <p className="text-xs font-bold text-slate-500 mt-2">The preview schema for {activeReport.title} is awaiting architectural implementation.</p>
        </div>
      );
    }

    // 2. Report is implemented, but user hasn't clicked "Preview" yet
    if (!previewData) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-600">
        <Eye size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-black uppercase tracking-widest">Click Generate Preview to View Data</p>
      </div>
    );

    // 3. User clicked preview, but the database returned zero records
    if (previewData.length === 0) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-600">
        <AlertTriangle size={48} className="mb-4 text-amber-500/50" />
        <p className="text-sm font-black uppercase tracking-widest text-amber-500">No Data Found for this Period / Section</p>
      </div>
    );

    // 4. Data exists! Calculate multi-page chunking
    const ROWS_PER_PAGE = orientation === 'portrait' ? 35 : 20;
    const pages = Array.from(
      { length: Math.ceil(previewData.length / ROWS_PER_PAGE) }, 
      (_, i) => previewData.slice(i * ROWS_PER_PAGE, i * ROWS_PER_PAGE + ROWS_PER_PAGE)
    );

    return (
      <div className="flex flex-col gap-8 pb-12" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
        {pages.map((pageData, pageIndex) => (
          <div 
            key={pageIndex}
            className="bg-white shadow-2xl mx-auto flex flex-col justify-between"
            style={{ 
              width: orientation === 'portrait' ? '210mm' : '297mm', 
              height: orientation === 'portrait' ? '297mm' : '210mm', 
              padding: '20mm',
              color: '#000',
              overflow: 'hidden' 
            }}
          >
            <div>
              {/* Only show the main header on Page 1 */}
              {pageIndex === 0 && (
                <div className="text-center mb-8 shrink-0">
                  <h1 className="text-2xl font-black uppercase tracking-widest mb-2">{activeReport.title} - {selectedSection}</h1>
                  <p className="text-sm italic text-gray-600">Period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</p>
                </div>
              )}

              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-black">
                    {activeReportId === 'husbandry' ? (
                      <>
                        <th className="p-3 font-bold border-x border-slate-300">Date/Time</th>
                        <th className="p-3 font-bold border-x border-slate-300">Animal</th>
                        <th className="p-3 font-bold border-x border-slate-300">Type</th>
                        <th className="p-3 font-bold border-x border-slate-300">Details</th>
                        <th className="p-3 font-bold border-x border-slate-300 text-center">Staff</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3 font-bold border-x border-slate-300">Animal</th>
                        <th className="p-3 font-bold border-x border-slate-300">Species</th>
                        <th className="p-3 font-bold border-x border-slate-300 text-center">Weight</th>
                        <th className="p-3 font-bold border-x border-slate-300 text-center">Date</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {activeReportId === 'husbandry' ? pageData.map(log => {
                    const animal = animals.find(a => a.id === log.animal_id);
                    const user = users.find(u => u.id === log.created_by);
                    let details = log.notes || '--';
                    if (log.log_type === 'FEED' && log.feed_details?.length > 0) {
                      details = `Fed: ${log.feed_details.map((f:any) => `${f.quantity}x ${f.food_type}`).join(', ')}\n${details}`;
                    }
                    return (
                      <tr key={log.id} className="border-b border-slate-300">
                        <td className="p-3 border-x border-slate-300 align-top">
                          <div>{new Date(log.log_date).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(log.log_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="p-3 border-x border-slate-300 align-top">
                          <div className="font-bold">{animal?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{animal?.species}</div>
                        </td>
                        <td className="p-3 border-x border-slate-300 align-top">{log.log_type}</td>
                        <td className="p-3 border-x border-slate-300 align-top whitespace-pre-wrap">{details}</td>
                        <td className="p-3 border-x border-slate-300 align-top text-center">{user?.initials || 'SYS'}</td>
                      </tr>
                    );
                  }) : pageData.map(log => {
                    const animal = animals.find(a => a.id === log.animal_id);
                    return (
                      <tr key={log.id} className="border-b border-slate-300">
                        <td className="p-3 border-x border-slate-300 font-bold">{animal?.name || 'Unknown'}</td>
                        <td className="p-3 border-x border-slate-300 text-gray-600">{animal?.species}</td>
                        <td className="p-3 border-x border-slate-300 text-center font-bold text-emerald-600">
                          {log.weight_not_required ? 'OMITTED' : `${log.weight_grams}${log.weight_unit || animal?.weight_unit || 'g'}`}
                        </td>
                        <td className="p-3 border-x border-slate-300 text-center">{new Date(log.log_date).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="mt-auto pt-4 border-t border-slate-200 text-center text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">
              Page {pageIndex + 1} of {pages.length}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] max-w-[1600px] mx-auto bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className="w-72 bg-[#0A0B0E] border-r border-slate-800/80 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-blue-600/10 p-2 rounded-xl border border-blue-500/20 shadow-inner">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Reports</h2>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Select ZLA Document</p>
        </div>

        <nav className="flex-grow p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {REPORTS.map((report) => {
            const Icon = report.icon;
            const isActive = activeReportId === report.id;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReportId(report.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.15)] border border-blue-500/50' 
                    : 'bg-[#0F1117] text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                  <span className="text-xs font-bold uppercase tracking-wide">{report.title}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-grow flex flex-col overflow-hidden p-6 space-y-4">
        
        {/* Controls Bar */}
        <div className="bg-[#0A0B0E] rounded-2xl border border-slate-800/80 p-5 shadow-inner shrink-0">
          <div className="flex flex-wrap items-end gap-5">
            {activeReportId !== 'site_maintenance' && activeReportId !== 'death_certificate' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-[#0F1117] border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 [&::-webkit-calendar-picker-indicator]:invert" />
                </div>
                
                {activeReportId !== 'staff_rota' ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-[#0F1117] border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 [&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Period</label>
                    <select value={rotaPeriod} onChange={(e) => setRotaPeriod(e.target.value as any)} className="w-full bg-[#0F1117] border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                      <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orientation</label>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value as any)} className="w-full bg-[#0F1117] border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                <option value="landscape">Landscape</option><option value="portrait">Portrait</option>
              </select>
            </div>

            {activeReportId !== 'site_maintenance' && activeReportId !== 'death_certificate' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{activeReportId === 'staff_rota' ? 'Role' : 'Section'}</label>
                <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full bg-[#0F1117] border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                  {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            <div className="ml-auto flex items-center gap-3">
              <button onClick={generatePreview} disabled={!isImplemented || isGenerating} className="bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 text-blue-400 px-5 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 disabled:opacity-30">
                <Eye size={14} /> Preview
              </button>
              <button onClick={handleDownload} disabled={!isImplemented || isGenerating || !previewData} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-30">
                <Download size={14} /> Download .DOCX
              </button>
            </div>
          </div>
        </div>

        {/* PREVIEW PANE */}
        <div className="flex-grow flex flex-col bg-[#1A1D24] rounded-2xl border border-slate-800/80 shadow-inner overflow-hidden relative">
          
          {/* Zoom Toolbar */}
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 bg-[#0A0B0E] border border-slate-800 p-1.5 rounded-xl shadow-2xl">
             <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><ZoomOut size={16}/></button>
             <span className="text-[10px] font-black text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
             <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><ZoomIn size={16}/></button>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar p-8 flex justify-center">
            {renderA4Preview()}
          </div>
        </div>

      </div>
    </div>
  );
}