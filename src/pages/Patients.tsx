import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, ChevronRight, UserPlus, Download, Send } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Patient } from '@/types';

const riskConfig = {
  low: { label: '低危', color: 'bg-mint-500', textColor: 'text-mint-500', borderColor: 'border-mint-500', bgLight: 'bg-mint-500/10' },
  medium: { label: '中危', color: 'bg-amber-500', textColor: 'text-amber-500', borderColor: 'border-amber-500', bgLight: 'bg-amber-500/10' },
  high: { label: '高危', color: 'bg-coral-500', textColor: 'text-coral-500', borderColor: 'border-coral-500', bgLight: 'bg-coral-500/10' },
};

const statusConfig = {
  active: { label: '活跃', color: 'bg-mint-500' },
  inactive: { label: '停诊', color: 'bg-slate-500' },
};

interface NewPatientForm {
  name: string;
  gender: 'male' | 'female';
  age: string;
  phone: string;
  chiefComplaint: string;
  medicalHistory: string;
}

const initialForm: NewPatientForm = {
  name: '',
  gender: 'male',
  age: '',
  phone: '',
  chiefComplaint: '',
  medicalHistory: '',
};

export default function Patients() {
  const navigate = useNavigate();
  const { patients, addPatient, getPatientAssessments } = useStore();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewPatientForm>(initialForm);

  const filtered = patients.filter((p) => {
    const matchSearch =
      p.name.includes(search) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'all' || p.riskLevel === riskFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchRisk && matchStatus;
  });

  const totalPatients = patients.length;
  const lowCount = patients.filter((p) => p.riskLevel === 'low').length;
  const mediumCount = patients.filter((p) => p.riskLevel === 'medium').length;
  const highCount = patients.filter((p) => p.riskLevel === 'high').length;

  const getLatestPsqi = (patientId: string): string | number => {
    const asmts = getPatientAssessments(patientId);
    if (asmts.length === 0) return '--';
    return asmts[asmts.length - 1].totalScore;
  };

  const handleSubmit = () => {
    if (!form.name || !form.age || !form.phone || !form.chiefComplaint) return;
    const maxNum = patients.reduce((max, p) => {
      const num = parseInt(p.id.replace('P', ''), 10);
      return num > max ? num : max;
    }, 0);
    const newId = 'P' + String(maxNum + 1).padStart(3, '0');
    const newPatient: Patient = {
      id: newId,
      name: form.name,
      gender: form.gender,
      age: parseInt(form.age, 10),
      phone: form.phone,
      chiefComplaint: form.chiefComplaint,
      medicalHistory: form.medicalHistory,
      riskLevel: 'low',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      nextVisitDate: null,
    };
    addPatient(newPatient);
    setForm(initialForm);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif text-white">患者管理</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-mint-500 hover:bg-mint-600 text-midnight-950 rounded-lg font-sans font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          初诊建档
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索患者姓名或ID..."
            className="w-full pl-10 pr-4 py-2 bg-midnight-950 border border-midnight-800/50 rounded-lg text-white placeholder-slate-500 font-sans text-sm focus:outline-none focus:border-mint-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
            className="px-3 py-2 bg-midnight-950 border border-midnight-800/50 rounded-lg text-white font-sans text-sm focus:outline-none focus:border-mint-500/50 appearance-none cursor-pointer"
          >
            <option value="all">全部风险</option>
            <option value="low">低危</option>
            <option value="medium">中危</option>
            <option value="high">高危</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 bg-midnight-950 border border-midnight-800/50 rounded-lg text-white font-sans text-sm focus:outline-none focus:border-mint-500/50 appearance-none cursor-pointer"
          >
            <option value="all">全部状态</option>
            <option value="active">活跃</option>
            <option value="inactive">停诊</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-midnight-950 border border-midnight-800/50 rounded-lg">
          <span className="text-slate-400 font-sans text-sm">总患者</span>
          <span className="text-white font-sans font-semibold">{totalPatients}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-midnight-950 border border-midnight-800/50 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-mint-500" />
          <span className="text-slate-400 font-sans text-sm">低危</span>
          <span className="text-mint-500 font-sans font-semibold">{lowCount}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-midnight-950 border border-midnight-800/50 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-400 font-sans text-sm">中危</span>
          <span className="text-amber-500 font-sans font-semibold">{mediumCount}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-midnight-950 border border-midnight-800/50 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-coral-500" />
          <span className="text-slate-400 font-sans text-sm">高危</span>
          <span className="text-coral-500 font-sans font-semibold">{highCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((patient, index) => {
          const risk = riskConfig[patient.riskLevel];
          const status = statusConfig[patient.status];
          const latestPsqi = getLatestPsqi(patient.id);
          return (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group bg-midnight-950 border border-midnight-800/50 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-midnight-800/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex">
                <div className={`w-1.5 shrink-0 ${risk.color}`} />
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-sans font-medium text-base">
                        {patient.name}
                      </span>
                      <span className="text-slate-400 font-sans text-sm">{patient.id}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-sans font-medium ${risk.bgLight} ${risk.textColor}`}>
                      {risk.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-400 font-sans text-sm">
                    <span>
                      {patient.gender === 'male' ? '♂' : '♀'} {patient.age}岁
                    </span>
                    <span className={`flex items-center gap-1.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
                      {status.label}
                    </span>
                  </div>

                  <p className="text-slate-400 font-sans text-sm truncate">
                    {patient.chiefComplaint}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-slate-400 font-sans text-sm">
                      <span>
                        PSQI: <span className="text-white font-medium">{latestPsqi}</span>
                      </span>
                      <span>
                        下次复诊:{' '}
                        <span className="text-white font-medium">
                          {patient.nextVisitDate ?? '--'}
                        </span>
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/assessment/${patient.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-midnight-800/50 hover:bg-midnight-800 text-mint-500 rounded-lg font-sans text-sm transition-colors"
                    >
                      评估
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-sans">
          <Search className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-lg">未找到匹配的患者</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-midnight-950 border border-midnight-800/50 rounded-xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif text-white">初诊建档</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(initialForm);
                }}
                className="text-slate-400 hover:text-white transition-colors font-sans text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-sans text-sm mb-1">姓名</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-midnight-900 border border-midnight-800/50 rounded-lg text-white font-sans text-sm focus:outline-none focus:border-mint-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-sans text-sm mb-1">性别</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-3 py-2 bg-midnight-900 border border-midnight-800/50 rounded-lg text-white font-sans text-sm focus:outline-none focus:border-mint-500/50 appearance-none cursor-pointer"
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-sans text-sm mb-1">年龄</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="w-full px-3 py-2 bg-midnight-900 border border-midnight-800/50 rounded-lg text-white font-sans text-sm focus:outline-none focus:border-mint-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-sans text-sm mb-1">联系电话</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-midnight-900 border border-midnight-800/50 rounded-lg text-white font-sans text-sm focus:outline-none focus:border-mint-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-sans text-sm mb-1">主诉</label>
                <textarea
                  value={form.chiefComplaint}
                  onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-midnight-900 border border-midnight-800/50 rounded-lg text-white font-sans text-sm focus:outline-none focus:border-mint-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-sans text-sm mb-1">病史</label>
                <textarea
                  value={form.medicalHistory}
                  onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-midnight-900 border border-midnight-800/50 rounded-lg text-white font-sans text-sm focus:outline-none focus:border-mint-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(initialForm);
                }}
                className="px-4 py-2 bg-midnight-800/50 hover:bg-midnight-800 text-slate-400 rounded-lg font-sans text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-mint-500 hover:bg-mint-600 text-midnight-950 rounded-lg font-sans font-medium text-sm transition-colors"
              >
                确认建档
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
