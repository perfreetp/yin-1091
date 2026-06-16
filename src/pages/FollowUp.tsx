import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ChevronDown,
  User,
  FileText,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { FollowUpTask } from '@/types';

const TYPE_ICON = {
  phone: Phone,
  sms: MessageSquare,
  visit: Calendar,
} as const;

const TYPE_LABEL = {
  phone: '电话随访',
  sms: '短信提醒',
  visit: '门诊随访',
} as const;

const STATUS_ACCENT: Record<FollowUpTask['status'], string> = {
  pending: 'bg-amber-500',
  in_progress: 'bg-midnight-500',
  completed: 'bg-mint-500',
};

const STATUS_DOT: Record<FollowUpTask['status'], string> = {
  pending: 'bg-amber-500',
  in_progress: 'bg-midnight-500',
  completed: 'bg-mint-500',
};

const COLUMN_META: { key: FollowUpTask['status']; label: string }[] = [
  { key: 'pending', label: '待执行' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

function TaskCard({
  task,
  patientName,
  patientPhone,
  isExpanded,
  onToggle,
}: {
  task: FollowUpTask;
  patientName: string;
  patientPhone: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { updateFollowUpTask } = useStore();
  const [resultText, setResultText] = useState(task.result ?? '');
  const [needsExtra, setNeedsExtra] = useState(task.needsExtraVisit);
  const [doctorConclusion, setDoctorConclusion] = useState(
    task.doctorConclusion ?? ''
  );

  const IconComp = TYPE_ICON[task.type];

  const handleStart = () => {
    updateFollowUpTask(task.id, { status: 'in_progress' });
  };

  const handleComplete = () => {
    updateFollowUpTask(task.id, {
      status: 'completed',
      result: resultText,
      needsExtraVisit: needsExtra,
      doctorConclusion: doctorConclusion || null,
      completedDate: new Date().toISOString(),
    });
  };

  return (
    <motion.div
      layout
      className="bg-midnight-950 border border-midnight-800/50 rounded-lg overflow-hidden"
    >
      <div
        className="p-3 cursor-pointer flex items-start gap-3"
        onClick={onToggle}
      >
        <div
          className={`w-2 h-2 rounded-full mt-2 shrink-0 ${STATUS_DOT[task.status]}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <IconComp size={14} className="text-slate-400" />
            <span className="text-xs text-slate-400">
              {TYPE_LABEL[task.type]}
            </span>
          </div>
          <p className="text-white text-sm font-medium truncate">
            {patientName}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock size={12} className="text-slate-400" />
            <span className="text-xs text-slate-400">
              {task.scheduledDate}
            </span>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 shrink-0 mt-1 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-midnight-800/50 pt-3 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Phone size={12} />
                <span>{patientPhone}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FileText size={12} />
                <span>
                  {task.result ?? '暂无随访记录'}
                </span>
              </div>

              {task.status === 'pending' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStart();
                  }}
                  className="w-full py-1.5 rounded-md bg-midnight-500 text-white text-sm font-medium hover:bg-midnight-600 transition-colors"
                >
                  开始执行
                </button>
              )}

              {task.status === 'in_progress' && (
                <>
                  <textarea
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="输入随访结果..."
                    className="w-full bg-midnight-900 border border-midnight-800/50 rounded-md p-2 text-sm text-white placeholder:text-slate-500 resize-none h-20 focus:outline-none focus:border-midnight-500"
                  />
                  <label
                    className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={needsExtra}
                      onChange={(e) => setNeedsExtra(e.target.checked)}
                      className="rounded border-midnight-700 bg-midnight-900 text-midnight-500 focus:ring-midnight-500"
                    />
                    需加号
                  </label>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleComplete();
                    }}
                    className="w-full py-1.5 rounded-md bg-mint-500 text-midnight-950 text-sm font-medium hover:bg-mint-600 transition-colors"
                  >
                    完成随访
                  </button>
                </>
              )}

              {task.status === 'completed' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle size={12} className="text-mint-500" />
                    <span>已完成</span>
                    {task.completedDate && (
                      <span className="text-slate-500">
                        {new Date(task.completedDate).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </div>
                  {task.result && (
                    <p className="text-xs text-slate-300">{task.result}</p>
                  )}
                  {task.needsExtraVisit && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-500">
                      <AlertCircle size={12} />
                      <span>需加号</span>
                    </div>
                  )}
                </div>
              )}

              {(task.status === 'in_progress' || task.status === 'completed') && (
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400 font-medium">
                    医生随访结论留档
                  </p>
                  {task.status === 'completed' ? (
                    <p className="text-xs text-slate-300">
                      {task.doctorConclusion ?? '无'}
                    </p>
                  ) : (
                    <textarea
                      value={doctorConclusion}
                      onChange={(e) => setDoctorConclusion(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="输入医生随访结论..."
                      className="w-full bg-midnight-900 border border-midnight-800/50 rounded-md p-2 text-sm text-white placeholder:text-slate-500 resize-none h-16 focus:outline-none focus:border-midnight-500"
                    />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AddTaskForm({ onClose }: { onClose: () => void }) {
  const { patients, addFollowUpTask } = useStore();
  const [patientId, setPatientId] = useState('');
  const [type, setType] = useState<FollowUpTask['type']>('phone');
  const [scheduledDate, setScheduledDate] = useState('');

  const handleSubmit = () => {
    if (!patientId || !scheduledDate) return;
    addFollowUpTask({
      id: `task-${Date.now()}`,
      patientId,
      type,
      status: 'pending',
      scheduledDate,
      completedDate: null,
      result: null,
      needsExtraVisit: false,
      doctorConclusion: null,
      createdBy: 'system',
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-midnight-950 border border-midnight-800/50 rounded-lg p-4 space-y-3"
    >
      <select
        value={patientId}
        onChange={(e) => setPatientId(e.target.value)}
        className="w-full bg-midnight-900 border border-midnight-800/50 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-midnight-500"
      >
        <option value="">选择患者</option>
        {patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <select
        value={type}
        onChange={(e) => setType(e.target.value as FollowUpTask['type'])}
        className="w-full bg-midnight-900 border border-midnight-800/50 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-midnight-500"
      >
        <option value="phone">电话随访</option>
        <option value="sms">短信提醒</option>
        <option value="visit">门诊随访</option>
      </select>

      <input
        type="date"
        value={scheduledDate}
        onChange={(e) => setScheduledDate(e.target.value)}
        className="w-full bg-midnight-900 border border-midnight-800/50 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-midnight-500"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="flex-1 py-1.5 rounded-md bg-midnight-500 text-white text-sm font-medium hover:bg-midnight-600 transition-colors"
        >
          添加
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-1.5 rounded-md bg-midnight-800/50 text-slate-400 text-sm hover:bg-midnight-800 transition-colors"
        >
          取消
        </button>
      </div>
    </motion.div>
  );
}

export default function FollowUp() {
  const { patients, followUpTasks, getPatientAssessments } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const patientMap = new Map(patients.map((p) => [p.id, p]));

  const patientsWithoutAssessments = patients.filter(
    (p) => getPatientAssessments(p.id).length === 0
  );

  const columns = COLUMN_META.map(({ key, label }) => ({
    key,
    label,
    tasks: followUpTasks.filter((t) => t.status === key),
  }));

  return (
    <div className="bg-midnight-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {patientsWithoutAssessments.length > 0 && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
            <AlertCircle size={18} className="text-amber-500 shrink-0" />
            <span className="text-sm text-amber-500">
              未完成量表提醒：{patientsWithoutAssessments.length}
              名患者尚未完成量表评估
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">随访管理</h1>
          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-midnight-500 text-white text-sm font-medium hover:bg-midnight-600 transition-colors"
          >
            <Plus size={16} />
            新建任务
          </button>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <AddTaskForm onClose={() => setShowAddForm(false)} />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-4">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col">
              <div
                className={`${STATUS_ACCENT[col.key]} h-1 rounded-t-xl`}
              />
              <div className="bg-midnight-950 rounded-b-xl p-3 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-sm font-medium">
                    {col.label}
                  </span>
                  <span className="text-xs text-slate-400 bg-midnight-800/50 rounded-full px-2 py-0.5">
                    {col.tasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.tasks.map((task) => {
                    const patient = patientMap.get(task.patientId);
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        patientName={patient?.name ?? '未知患者'}
                        patientPhone={patient?.phone ?? '-'}
                        isExpanded={expandedId === task.id}
                        onToggle={() =>
                          setExpandedId((prev) =>
                            prev === task.id ? null : task.id
                          )
                        }
                      />
                    );
                  })}
                  {col.tasks.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      暂无任务
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
