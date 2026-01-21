"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";

const data = [
    { name: 'Mon', bpSys: 120, bpDia: 80, sugar: 5.5 },
    { name: 'Tue', bpSys: 122, bpDia: 82, sugar: 5.6 },
    { name: 'Wed', bpSys: 118, bpDia: 79, sugar: 5.4 },
    { name: 'Thu', bpSys: 125, bpDia: 85, sugar: 6.1 },
    { name: 'Fri', bpSys: 121, bpDia: 81, sugar: 5.8 },
    { name: 'Sat', bpSys: 119, bpDia: 80, sugar: 5.5 },
    { name: 'Sun', bpSys: 123, bpDia: 83, sugar: 5.7 },
];

export default function VitalsGraphWidget({ patients }: { patients?: any[] }) {
    const t = useTranslation();

    // Logic to aggregate patient data would go here.
    // For now, if patients are passed, we could try to visualize their average, 
    // but the original request was to simply "ensure" it works. 
    // The current static data is fine for a demo if no real history exists.
    // To make it truly dynamic, we'd need to fetch historical vitals from ALL patients, 
    // which is expensive. 
    // For V2.1, let's keep the static demo data as a placeholder unless specific logic is requested.


    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        {t.dashboard.vitals.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t.dashboard.vitals.subtitle}</p>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                            itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Legend iconType="circle" />
                        <Area type="monotone" dataKey="bpSys" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBp)" name={t.dashboard.vitals.sysBp} />
                        <Area type="monotone" dataKey="sugar" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorSugar)" name={t.dashboard.vitals.sugar} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
