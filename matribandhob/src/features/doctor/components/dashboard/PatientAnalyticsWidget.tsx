"use client";
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import { Activity, PieChart as PieIcon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function PatientAnalyticsWidget({ patients }: { patients: any[] }) {
    const { darkMode } = useTheme();

    // 1. Calculate Risk Dist
    const riskData = {
        normal: patients.filter(p => !p.isHighRisk && !p.sosTriggered).length,
        highRisk: patients.filter(p => p.isHighRisk && !p.sosTriggered).length,
        sos: patients.filter(p => p.sosTriggered).length
    };

    // 2. Calculate Trimesters
    const trimesters = {
        first: patients.filter(p => (p.week || 0) <= 12).length,
        second: patients.filter(p => (p.week || 0) > 12 && (p.week || 0) <= 26).length,
        third: patients.filter(p => (p.week || 0) > 26).length
    };

    const pieData = {
        labels: ['Normal', 'High Risk', 'SOS Alert'],
        datasets: [
            {
                data: [riskData.normal, riskData.highRisk, riskData.sos],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)', // Green
                    'rgba(245, 158, 11, 0.8)', // Amber
                    'rgba(239, 68, 68, 0.8)',  // Red
                ],
                borderColor: [
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                ],
                borderWidth: 1,
            },
        ],
    };

    const barData = {
        labels: ['1st Trimester', '2nd Trimester', '3rd Trimester'],
        datasets: [
            {
                label: 'Patients',
                data: [trimesters.first, trimesters.second, trimesters.third],
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: '#6366f1',
                borderWidth: 1,
                borderRadius: 8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { color: darkMode ? '#cbd5e1' : '#475569' }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                ticks: { color: darkMode ? '#94a3b8' : '#64748b' }
            },
            x: {
                grid: { display: false },
                ticks: { color: darkMode ? '#94a3b8' : '#64748b' }
            }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* RISK PIE CHART */}
            <div className={`p-6 rounded-3xl border shadow-sm flex flex-col ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
                <h3 className={`text-md font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-800"}`}>
                    <PieIcon className="w-4 h-4 text-teal-500" /> Patient Risk Distribution
                </h3>
                <div className="flex-1 relative min-h-[200px]">
                    {patients.length > 0 ? (
                        <Pie data={pieData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: darkMode ? '#ccc' : '#333', font: { size: 11, weight: 'bold' } } } } }} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">No Patient Data</div>
                    )}
                </div>
            </div>

            {/* TRIMESTER BAR CHART */}
            <div className={`p-6 rounded-3xl border shadow-sm flex flex-col ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
                <h3 className={`text-md font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-800"}`}>
                    <Activity className="w-4 h-4 text-indigo-500" /> Pregnancy Stages
                </h3>
                <div className="flex-1 relative min-h-[200px]">
                    {patients.length > 0 ? (
                        <Bar data={barData} options={options} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">No Patient Data</div>
                    )}
                </div>
            </div>
        </div>
    );
}
