import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Activity, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import type { PSQIAssessment } from '@/types';

const TIME_RANGES = [
  { label: '近7天', days: 7 },
  { label: '近30天', days: 30 },
  { label: '近3个月', days: 90 },
  { label: '全部', days: 0 },
] as const;

const PSQI_COMPONENTS = [
  { key: 'subjectiveQuality', name: '主观睡眠质量' },
  { key: 'sleepLatency', name: '入睡时间' },
  { key: 'sleepDuration', name: '睡眠时间' },
  { key: 'sleepEfficiency', name: '睡眠效率' },
  { key: 'sleepDisturbance', name: '睡眠障碍' },
  { key: 'hypnoticMedication', name: '催眠药物' },
  { key: 'daytimeDysfunction', name: '日间功能障碍' },
] as const;

const COMPONENT_COLORS = ['#4a90d9', '#2dd4a8', '#f5a623', '#e74c3c', '#9b59b6', '#1abc9c', '#f0923b'];

const SCORE_RANGES = [
  { label: '0-5 低危', min: 0, max: 5, color: '#2dd4a8' },
  { label: '6-10 中危', min: 6, max: 10, color: '#f5a623' },
  { label: '11-15 高危', min: 11, max: 15, color: '#e74c3c' },
  { label: '16-21 极高危', min: 16, max: 21, color: '#c0392b' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-midnight-800 border border-midnight-700 text-white rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function Reports() {
  const { patients, assessments, getPatientAssessments } = useStore();
  const [timeRange, setTimeRange] = useState<number>(30);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const filteredAssessments = useMemo(() => {
    if (timeRange === 0) return assessments;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeRange);
    return assessments.filter((a) => new Date(a.createdAt) >= cutoff);
  }, [assessments, timeRange]);

  const trendData = useMemo(() => {
    const countByDate: Record<string, number> = {};
    filteredAssessments.forEach((a) => {
      const date = a.createdAt;
      countByDate[date] = (countByDate[date] || 0) + 1;
    });
    return Object.entries(countByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [filteredAssessments]);

  const scoreDistribution = useMemo(() => {
    const patientLatestScores: Record<string, number> = {};
    filteredAssessments.forEach((a) => {
      const existing = patientLatestScores[a.patientId];
      if (!existing || a.createdAt > (existing as any)) {
        patientLatestScores[a.patientId] = a.totalScore;
      }
    });
    const scores = Object.values(patientLatestScores);
    return SCORE_RANGES.map((range) => ({
      range: range.label,
      count: scores.filter((s) => s >= range.min && s <= range.max).length,
      fill: range.color,
    }));
  }, [filteredAssessments]);

  const patientTrendData = useMemo(() => {
    if (!selectedPatientId) return [];
    const patientAssessments = getPatientAssessments(selectedPatientId).sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt)
    );
    return patientAssessments.map((a) => ({
      date: a.createdAt,
      subjectiveQuality: a.subjectiveQuality,
      sleepLatency: a.sleepLatency,
      sleepDuration: a.sleepDuration,
      sleepEfficiency: a.sleepEfficiency,
      sleepDisturbance: a.sleepDisturbance,
      hypnoticMedication: a.hypnoticMedication,
      daytimeDysfunction: a.daytimeDysfunction,
    }));
  }, [selectedPatientId, getPatientAssessments]);

  const interventionData = useMemo(() => {
    const patientFirstLast: Record<
      string,
      { name: string; first: number; last: number }
    > = {};
    const patientAssessmentMap: Record<string, PSQIAssessment[]> = {};
    filteredAssessments.forEach((a) => {
      if (!patientAssessmentMap[a.patientId]) patientAssessmentMap[a.patientId] = [];
      patientAssessmentMap[a.patientId].push(a);
    });
    Object.entries(patientAssessmentMap).forEach(([patientId, asmts]) => {
      if (asmts.length < 2) return;
      const sorted = [...asmts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const first = sorted[0].totalScore;
      const last = sorted[sorted.length - 1].totalScore;
      if (first === last) return;
      const patient = patients.find((p) => p.id === patientId);
      patientFirstLast[patientId] = {
        name: patient?.name || patientId,
        first,
        last,
      };
    });
    return Object.entries(patientFirstLast).map(([id, data]) => ({
      patient: data.name,
      首次评分: data.first,
      最新评分: data.last,
    }));
  }, [filteredAssessments, patients]);

  const summaryStats = useMemo(() => {
    const totalPatients = patients.length;
    const patientLatestScores: Record<string, number> = {};
    const patientFirstScores: Record<string, number> = {};
    const patientLatestDate: Record<string, string> = {};
    const patientFirstDate: Record<string, string> = {};
    filteredAssessments.forEach((a) => {
      const prevLatest = patientLatestDate[a.patientId];
      if (prevLatest === undefined || a.createdAt > prevLatest) {
        patientLatestDate[a.patientId] = a.createdAt;
        patientLatestScores[a.patientId] = a.totalScore;
      }
      const prevFirst = patientFirstDate[a.patientId];
      if (prevFirst === undefined || a.createdAt < prevFirst) {
        patientFirstDate[a.patientId] = a.createdAt;
        patientFirstScores[a.patientId] = a.totalScore;
      }
    });
    const allLatestScores = Object.values(patientLatestScores);
    const avgScore =
      allLatestScores.length > 0
        ? (allLatestScores.reduce((s, v) => s + v, 0) / allLatestScores.length).toFixed(1)
        : '0';
    let improved = 0;
    Object.keys(patientLatestScores).forEach((pid) => {
      if (patientFirstScores[pid] !== undefined && patientLatestScores[pid] < patientFirstScores[pid]) {
        improved++;
      }
    });
    const needsAttention = allLatestScores.filter((s) => s > 10).length;
    return { totalPatients, avgScore, improved, needsAttention };
  }, [patients, filteredAssessments]);

  const patientsWithAssessments = useMemo(() => {
    const ids = new Set(assessments.map((a) => a.patientId));
    return patients.filter((p) => ids.has(p.id));
  }, [patients, assessments]);

  return (
    <div className="bg-midnight-900 min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-midnight-500" />
          <h1 className="text-2xl font-bold text-white">数据报表</h1>
        </div>
        <div className="flex gap-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setTimeRange(range.days)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range.days
                  ? 'bg-midnight-500 text-white'
                  : 'bg-midnight-800/50 text-slate-400 hover:text-white hover:bg-midnight-700/50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            icon: Users,
            label: '总患者数',
            value: summaryStats.totalPatients,
            color: 'text-midnight-500',
          },
          {
            icon: Activity,
            label: '平均PSQI评分',
            value: summaryStats.avgScore,
            color: 'text-amber-500',
          },
          {
            icon: TrendingUp,
            label: '已改善患者',
            value: summaryStats.improved,
            color: 'text-mint-500',
          },
          {
            icon: Calendar,
            label: '需关注患者',
            value: summaryStats.needsAttention,
            color: 'text-coral-500',
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-5 flex items-center gap-4"
          >
            <stat.icon className={`w-8 h-8 ${stat.color}`} />
            <div>
              <p className="text-slate-500 text-sm">{stat.label}</p>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-5"
        >
          <h2 className="text-white text-lg font-semibold mb-4">门诊量趋势</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#4a90d9"
                strokeWidth={2}
                dot={{ fill: '#4a90d9', r: 4 }}
                activeDot={{ r: 6 }}
                name="门诊量"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-5"
        >
          <h2 className="text-white text-lg font-semibold mb-4">PSQI评分分布</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" opacity={0.3} />
              <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="患者数" radius={[4, 4, 0, 0]}>
                {scoreDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">症状变化对比</h2>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="bg-midnight-800 border border-midnight-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-midnight-500"
            >
              <option value="">选择患者</option>
              {patientsWithAssessments.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {selectedPatientId && patientTrendData.length > 0 ? (
              <LineChart data={patientTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {PSQI_COMPONENTS.map((comp, i) => (
                  <Line
                    key={comp.key}
                    type="monotone"
                    dataKey={comp.key}
                    name={comp.name}
                    stroke={COMPONENT_COLORS[i]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                请选择一位患者查看症状变化趋势
              </div>
            )}
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-5"
        >
          <h2 className="text-white text-lg font-semibold mb-4">干预效果分析</h2>
          <ResponsiveContainer width="100%" height={300}>
            {interventionData.length > 0 ? (
              <BarChart data={interventionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" opacity={0.3} />
                <XAxis dataKey="patient" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="首次评分" fill="#3a6096" radius={[4, 4, 0, 0]} />
                <Bar dataKey="最新评分" fill="#2dd4a8" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                暂无干预效果数据
              </div>
            )}
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
