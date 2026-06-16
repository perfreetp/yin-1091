import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useStore } from '@/store/useStore';
import type { MedicationRecord, NonPharmIntervention } from '@/types';

const PSQI_SECTIONS = [
  {
    key: 'subjectiveQuality' as const,
    title: '主观睡眠质量',
    description: '您对自己近一个月的总体睡眠质量评价如何？',
    labels: ['很好', '较好', '较差', '很差'],
  },
  {
    key: 'sleepLatency' as const,
    title: '入睡时间',
    description: '近一个月您每晚通常需要多长时间才能入睡？',
    labels: ['≤15分钟', '16-30分钟', '31-60分钟', '>60分钟'],
  },
  {
    key: 'sleepDuration' as const,
    title: '睡眠时间',
    description: '近一个月您每晚实际睡眠时间大约有多长？',
    labels: ['>7小时', '6-7小时', '5-6小时', '<5小时'],
  },
  {
    key: 'sleepEfficiency' as const,
    title: '睡眠效率',
    description: '近一个月您的睡眠效率如何（卧床时间中实际睡眠的比例）？',
    labels: ['>85%', '75-84%', '65-74%', '<65%'],
  },
  {
    key: 'sleepDisturbance' as const,
    title: '睡眠障碍',
    description: '近一个月您是否因以下原因导致睡眠受影响：夜间易醒、早醒、需起床上厕所、呼吸不畅、咳嗽或打鼾、感觉太冷或太热、做噩梦、疼痛等？',
    labels: ['无', '轻微', '中度', '重度'],
  },
  {
    key: 'hypnoticMedication' as const,
    title: '催眠药物',
    description: '近一个月您是否需要服用催眠药物帮助睡眠？',
    labels: ['无', '偶尔', '有时', '经常'],
  },
  {
    key: 'daytimeDysfunction' as const,
    title: '日间功能障碍',
    description: '近一个月您在开车、吃饭或参加社交活动时是否难以保持清醒？您在做事时是否感到精力不足？',
    labels: ['无', '轻微', '中度', '重度'],
  },
];

const RISK_COLORS = {
  low: 'text-mint-500 bg-mint-500/10 border-mint-500/30',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  high: 'text-coral-500 bg-coral-500/10 border-coral-500/30',
};

const RISK_GAUGE_COLORS = {
  low: '#2dd4a8',
  medium: '#f5a623',
  high: '#e74c3c',
};

const RISK_LABELS = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

const RISK_INTERPRETATIONS = {
  low: '睡眠质量良好，建议维持当前健康睡眠习惯，定期复查即可。',
  medium: '存在一定睡眠问题，建议加强睡眠卫生教育，必要时进行CBT-I干预，按时复诊。',
  high: '严重睡眠障碍，建议积极药物干预联合CBT-I治疗，密切随访，1周内复诊。',
};

const NON_PHARM_OPTIONS = [
  { type: 'cbti' as const, label: 'CBT-I（认知行为疗法）' },
  { type: 'sleepHygiene' as const, label: '睡眠卫生教育' },
  { type: 'relaxation' as const, label: '放松训练' },
  { type: 'other' as const, label: '其他' },
];

const EMPTY_MEDICATION: MedicationRecord = {
  name: '',
  dosage: '',
  frequency: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: null,
};

export default function Assessment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, addAssessment, updatePatient, getPatientAssessments, getRiskLevel } = useStore();

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({
    subjectiveQuality: 0,
    sleepLatency: 0,
    sleepDuration: 0,
    sleepEfficiency: 0,
    sleepDisturbance: 0,
    hypnoticMedication: 0,
    daytimeDysfunction: 0,
  });
  const [complaintNotes, setComplaintNotes] = useState('');
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [nonPharmInterventions, setNonPharmInterventions] = useState<NonPharmIntervention[]>([]);
  const [recommendedVisitDate, setRecommendedVisitDate] = useState('');

  const isNew = id === 'new';
  const patientId = isNew ? selectedPatientId : (id ?? '');
  const patient = patients.find((p) => p.id === patientId);

  const totalScore = useMemo(
    () => Object.values(scores).reduce((sum, v) => sum + v, 0),
    [scores]
  );

  const riskLevel = useMemo(() => getRiskLevel(totalScore), [totalScore, getRiskLevel]);

  const recommendedDays = useMemo(() => {
    if (riskLevel === 'high') return 7;
    if (riskLevel === 'medium') return 14;
    return 30;
  }, [riskLevel]);

  useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + recommendedDays);
    setRecommendedVisitDate(date.toISOString().slice(0, 10));
  }, [recommendedDays]);

  const previousAssessments = useMemo(
    () => (patientId ? getPatientAssessments(patientId) : []),
    [patientId, getPatientAssessments]
  );

  const trendData = useMemo(
    () =>
      previousAssessments
        .slice(-6)
        .map((a) => ({ date: a.createdAt.slice(5), score: a.totalScore })),
    [previousAssessments]
  );

  const radarData = useMemo(
    () =>
      PSQI_SECTIONS.map((s) => ({
        component: s.title.slice(0, 4),
        score: scores[s.key],
        fullMark: 3,
      })),
    [scores]
  );

  const trendIcon = useMemo(() => {
    if (trendData.length < 2) return <Minus className="w-4 h-4 text-slate-400" />;
    const last = trendData[trendData.length - 1].score;
    const prev = trendData[trendData.length - 2].score;
    if (last > prev) return <TrendingUp className="w-4 h-4 text-coral-500" />;
    if (last < prev) return <TrendingDown className="w-4 h-4 text-mint-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  }, [trendData]);

  const gaugeRadius = 70;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeProgress = (totalScore / 21) * gaugeCircumference;

  function handleScoreChange(key: string, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddMedication() {
    setMedications((prev) => [...prev, { ...EMPTY_MEDICATION }]);
  }

  function handleMedicationChange(index: number, field: keyof MedicationRecord, value: string) {
    setMedications((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  function handleRemoveMedication(index: number) {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  }

  function handleNonPharmToggle(type: NonPharmIntervention['type']) {
    setNonPharmInterventions((prev) => {
      const exists = prev.find((n) => n.type === type);
      if (exists) return prev.filter((n) => n.type !== type);
      return [...prev, { type, description: '', startDate: new Date().toISOString().slice(0, 10) }];
    });
  }

  function handleNonPharmDescChange(type: NonPharmIntervention['type'], description: string) {
    setNonPharmInterventions((prev) =>
      prev.map((n) => (n.type === type ? { ...n, description } : n))
    );
  }

  function handleSubmit() {
    if (!patientId) return;
    const assessmentId = `A${Date.now()}`;
    addAssessment({
      id: assessmentId,
      patientId,
      subjectiveQuality: scores.subjectiveQuality,
      sleepLatency: scores.sleepLatency,
      sleepDuration: scores.sleepDuration,
      sleepEfficiency: scores.sleepEfficiency,
      sleepDisturbance: scores.sleepDisturbance,
      hypnoticMedication: scores.hypnoticMedication,
      daytimeDysfunction: scores.daytimeDysfunction,
      totalScore,
      complaintNotes,
      medications,
      nonPharmInterventions,
      recommendedVisitDate,
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: '王医生',
    });
    updatePatient(patientId, {
      riskLevel,
      nextVisitDate: recommendedVisitDate,
    });
    navigate('/patients');
  }

  return (
    <div className="min-h-screen bg-midnight-900 p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回患者列表</span>
          </button>
        </div>

        {isNew && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-4 mb-6"
          >
            <label className="block text-sm text-slate-400 mb-2">选择患者</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full max-w-md bg-midnight-900 border border-midnight-800/50 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-mint-500/50"
            >
              <option value="">-- 请选择患者 --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.gender === 'male' ? '男' : '女'}, {p.age}岁)
                </option>
              ))}
            </select>
          </motion.div>
        )}

        {patient && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-midnight-800 flex items-center justify-center text-sm text-mint-500 font-medium">
                    {patient.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium">{patient.name}</p>
                    <p className="text-xs text-slate-400">
                      {patient.gender === 'male' ? '男' : '女'} · {patient.age}岁 · {patient.phone}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${RISK_COLORS[patient.riskLevel]}`}
                >
                  {RISK_LABELS[patient.riskLevel]}
                </span>
              </div>

              {trendData.length >= 2 && (
                <div className="flex items-center gap-3">
                  <div className="w-[120px] h-[40px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#4a90d9"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {trendIcon}
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0 space-y-6">
            {PSQI_SECTIONS.map((section, sIdx) => (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sIdx * 0.05 }}
                className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-midnight-800 flex items-center justify-center text-xs text-mint-500">
                        {sIdx + 1}
                      </span>
                      {section.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 ml-8">{section.description}</p>
                  </div>
                  <span className="text-lg font-semibold text-mint-500">
                    {scores[section.key]}
                  </span>
                </div>
                <div className="ml-8 grid grid-cols-4 gap-3">
                  {section.labels.map((label, value) => (
                    <button
                      key={value}
                      onClick={() => handleScoreChange(section.key, value)}
                      className={`relative flex flex-col items-center gap-1 p-3 rounded-lg border transition-all duration-200 ${
                        scores[section.key] === value
                          ? 'border-mint-500 bg-mint-500/10 shadow-lg shadow-mint-500/5'
                          : 'border-midnight-800/50 bg-midnight-900 hover:border-midnight-700'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all ${
                          scores[section.key] === value
                            ? 'border-mint-500 text-mint-500 bg-mint-500/20'
                            : 'border-midnight-700 text-slate-500'
                        }`}
                      >
                        {value}
                      </span>
                      <span
                        className={`text-xs ${
                          scores[section.key] === value ? 'text-mint-500' : 'text-slate-500'
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-5"
            >
              <h3 className="text-white font-medium mb-3">失眠主诉备注</h3>
              <textarea
                value={complaintNotes}
                onChange={(e) => setComplaintNotes(e.target.value)}
                rows={4}
                placeholder="请详细描述患者失眠主诉及症状表现..."
                className="w-full bg-midnight-900 border border-midnight-800/50 rounded-lg px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-mint-500/50 resize-none"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">用药干预记录</h3>
                <button
                  onClick={handleAddMedication}
                  className="px-3 py-1.5 rounded-lg bg-mint-500/10 text-mint-500 text-xs font-medium hover:bg-mint-500/20 transition-colors"
                >
                  + 添加药物
                </button>
              </div>
              {medications.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">暂无用药记录，点击上方按钮添加</p>
              )}
              <div className="space-y-3">
                {medications.map((med, idx) => (
                  <div
                    key={idx}
                    className="flex items-end gap-3 bg-midnight-900 rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs text-slate-400 mb-1">药品名称</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => handleMedicationChange(idx, 'name', e.target.value)}
                        className="w-full bg-midnight-950 border border-midnight-800/50 rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-mint-500/50"
                        placeholder="如：佐匹克隆"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-slate-400 mb-1">剂量</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                        className="w-full bg-midnight-950 border border-midnight-800/50 rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-mint-500/50"
                        placeholder="3.75mg"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs text-slate-400 mb-1">频率</label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => handleMedicationChange(idx, 'frequency', e.target.value)}
                        className="w-full bg-midnight-950 border border-midnight-800/50 rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-mint-500/50"
                        placeholder="每晚一次"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs text-slate-400 mb-1">开始日期</label>
                      <input
                        type="date"
                        value={med.startDate}
                        onChange={(e) => handleMedicationChange(idx, 'startDate', e.target.value)}
                        className="w-full bg-midnight-950 border border-midnight-800/50 rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-mint-500/50"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs text-slate-400 mb-1">结束日期</label>
                      <input
                        type="date"
                        value={med.endDate ?? ''}
                        onChange={(e) =>
                          handleMedicationChange(idx, 'endDate', e.target.value || null)
                        }
                        className="w-full bg-midnight-950 border border-midnight-800/50 rounded-md px-3 py-1.5 text-white text-sm focus:outline-none focus:border-mint-500/50"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveMedication(idx)}
                      className="px-2 py-1.5 text-coral-500 hover:bg-coral-500/10 rounded-md transition-colors text-sm"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-5"
            >
              <h3 className="text-white font-medium mb-4">非药物干预记录</h3>
              <div className="space-y-3">
                {NON_PHARM_OPTIONS.map((opt) => {
                  const selected = nonPharmInterventions.some((n) => n.type === opt.type);
                  const intervention = nonPharmInterventions.find((n) => n.type === opt.type);
                  return (
                    <div key={opt.type} className="bg-midnight-900 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleNonPharmToggle(opt.type)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            selected
                              ? 'border-mint-500 bg-mint-500/20'
                              : 'border-midnight-700'
                          }`}
                        >
                          {selected && (
                            <svg className="w-3 h-3 text-mint-500" viewBox="0 0 12 12" fill="none">
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>
                        <span className={`text-sm ${selected ? 'text-white' : 'text-slate-400'}`}>
                          {opt.label}
                        </span>
                      </div>
                      {selected && (
                        <div className="mt-2 ml-8">
                          <input
                            type="text"
                            value={intervention?.description ?? ''}
                            onChange={(e) => handleNonPharmDescChange(opt.type, e.target.value)}
                            placeholder="请描述具体干预方案..."
                            className="w-full bg-midnight-950 border border-midnight-800/50 rounded-md px-3 py-1.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-mint-500/50"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-mint-500" />
                <h3 className="text-white font-medium">复诊时间建议</h3>
                <span className="text-xs text-slate-400">
                  （基于风险等级自动推荐：高风险7天 / 中风险14天 / 低风险30天）
                </span>
              </div>
              <input
                type="date"
                value={recommendedVisitDate}
                onChange={(e) => setRecommendedVisitDate(e.target.value)}
                className="bg-midnight-900 border border-midnight-800/50 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-mint-500/50"
              />
            </motion.div>
          </div>

          <div className="w-[340px] flex-shrink-0 sticky top-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-5 space-y-5"
            >
              <div className="flex flex-col items-center">
                <div className="relative w-[160px] h-[160px]">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle
                      cx="80"
                      cy="80"
                      r={gaugeRadius}
                      fill="none"
                      stroke="#1e3a5f"
                      strokeWidth="8"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r={gaugeRadius}
                      fill="none"
                      stroke={RISK_GAUGE_COLORS[riskLevel]}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={gaugeCircumference}
                      strokeDashoffset={gaugeCircumference - gaugeProgress}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{totalScore}</span>
                    <span className="text-xs text-slate-400">/ 21</span>
                  </div>
                </div>
                <span
                  className={`mt-3 px-4 py-1 rounded-full text-sm font-medium border ${RISK_COLORS[riskLevel]}`}
                >
                  {RISK_LABELS[riskLevel]}
                </span>
              </div>

              <div className="bg-midnight-900 rounded-lg p-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  {RISK_INTERPRETATIONS[riskLevel]}
                </p>
              </div>

              <div>
                <h4 className="text-sm text-slate-400 mb-3">各维度评分</h4>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#1e3a5f" />
                      <PolarAngleAxis
                        dataKey="component"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 3]}
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        dataKey="score"
                        stroke={RISK_GAUGE_COLORS[riskLevel]}
                        fill={RISK_GAUGE_COLORS[riskLevel]}
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2">
                {PSQI_SECTIONS.map((s) => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{s.title}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-midnight-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(scores[s.key] / 3) * 100}%`,
                            backgroundColor: RISK_GAUGE_COLORS[getRiskLevel(scores[s.key] * 7 / 3 > 1 ? 11 : scores[s.key] * 7 / 3 > 0.7 ? 6 : 3)],
                          }}
                        />
                      </div>
                      <span className="text-xs text-white w-4 text-right">{scores[s.key]}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!patientId}
                className="w-full flex items-center justify-center gap-2 bg-mint-500 hover:bg-mint-600 disabled:opacity-40 disabled:cursor-not-allowed text-midnight-950 font-medium py-3 rounded-xl transition-colors"
              >
                <Save className="w-4 h-4" />
                保存评估
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
