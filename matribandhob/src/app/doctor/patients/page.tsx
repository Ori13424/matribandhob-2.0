"use client";
import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore"; 
import { db } from "@/lib/firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dynamic from "next/dynamic";

// --- COMPONENTS ---
import PatientPageHeader from "@/features/doctor/components/patients/PatientPageHeader";
import PatientFilters from "@/features/doctor/components/patients/PatientFilters";
import PatientListTable from "@/features/doctor/components/patients/PatientListTable";
import PatientLocationModal from "@/features/doctor/components/patients/PatientLocationModal";
import AddPatientModal from "@/features/doctor/components/patients/AddPatientModal";
import DoctorChatDrawer from "@/features/doctor/components/patients/DoctorChatDrawer";

const PatientMap = dynamic(
  () => import("@/features/doctor/components/patients/PatientMap"), 
  { ssr: false, loading: () => <div className="h-[600px] bg-slate-100 animate-pulse rounded-3xl w-full flex items-center justify-center text-slate-400">Loading Map...</div> }
);

export default function MyPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Modals
  const [selectedPatientLocation, setSelectedPatientLocation] = useState<any>(null);
  const [selectedChatPatient, setSelectedChatPatient] = useState<any>(null); 
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- 1. REAL-TIME DATA FETCHING ---
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "users")); 

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        
        // --- EXCLUSION LOGIC ---
        // Exclude Doctors AND Drivers
        if (d.role === 'doctor' || d.role === 'driver') return null;
        
        let status = "Normal"; 
        let statusColor = "green";
        if (d.sosTriggered) { status = "SOS ALERT"; statusColor = "red"; }
        else if (d.isHighRisk) { status = "High Risk"; statusColor = "yellow"; }

        return {
          id: doc.id,
          name: d.basicInfo?.fullName || d.fullName || "Unknown",
          email: d.email || "N/A",
          phone: d.phoneNumber || "N/A",
          week: d.pregnancyDetails?.currentWeek || 0,
          edd: d.pregnancyDetails?.edd || "N/A",
          bloodGroup: d.basicInfo?.bloodGroup || "--",
          lastActive: d.lastActive ? "Recently" : "Inactive",
          isOnline: d.isOnline || false,
          location: d.location || null, 
          sosTriggered: d.sosTriggered === true,
          status, 
          statusColor
        };
      }).filter(Boolean);

      setPatients(data);
      setLoading(false);
    }, (error) => console.error("Error fetching patients:", error));

    return () => unsubscribe();
  }, []);

  // --- 2. EXPORT FUNCTION ---
  const handleExport = () => {
    const doc = new jsPDF();
    doc.text("Matri-Bandhob Patient List", 14, 15);
    
    // Filter logic needs to be accessed here or duplicated
    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search);
        return matchesSearch;
    });

    const tableData = filteredPatients.map(p => [
      p.name,
      p.week + " Weeks",
      p.bloodGroup,
      p.status,
      p.edd
    ]);

    autoTable(doc, {
      head: [['Name', 'Pregnancy Week', 'Blood Group', 'Risk Status', 'EDD']],
      body: tableData,
      startY: 20,
    });

    doc.save("patient-list.pdf");
  };

  // --- 3. FILTER LOGIC ---
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search);
    const matchesRisk = riskFilter === 'all' 
      ? true 
      : riskFilter === 'sos' ? p.status === 'SOS ALERT' 
      : riskFilter === 'high' ? p.status === 'High Risk'
      : p.status === 'Normal';
    return matchesSearch && matchesRisk;
  });

  const stats = {
    total: patients.length,
    highRisk: patients.filter(p => p.statusColor === 'yellow' || p.statusColor === 'red').length,
    sosActive: patients.filter(p => p.status === 'SOS ALERT').length
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PatientPageHeader 
        {...stats}
        onAddPatient={() => setIsAddModalOpen(true)}
        onExport={handleExport}
      />
      <PatientFilters 
        search={search} setSearch={setSearch}
        riskFilter={riskFilter} setRiskFilter={setRiskFilter}
        viewMode={viewMode} setViewMode={setViewMode}
      />
      {viewMode === 'list' ? (
        <PatientListTable 
          patients={filteredPatients}
          onLocate={(p: any) => setSelectedPatientLocation(p)}
          onChat={(p: any) => setSelectedChatPatient(p)} 
        />
      ) : (
        <div className="w-full">
           <PatientMap patients={filteredPatients} />
        </div>
      )}
      {selectedPatientLocation && <PatientLocationModal patient={selectedPatientLocation} onClose={() => setSelectedPatientLocation(null)} />}
      {isAddModalOpen && <AddPatientModal onClose={() => setIsAddModalOpen(false)} />}
      {selectedChatPatient && <DoctorChatDrawer patient={selectedChatPatient} onClose={() => setSelectedChatPatient(null)} />}
    </div>
  );
}