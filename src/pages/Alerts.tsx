import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Clock,
  TrendingUp,
  TrendingDown,
  Phone,
  Send,
  CalendarPlus,
  CheckCircle,
  XCircle,
  Shield,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Alert, FollowUpTask } from '@/types';

type FilterTab = 'all' | 'high_score' | 'overdue_visit' | 'risk_change';

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '今天';
  if (diffDays < 30) return `${diffDays}天前`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}个月前`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}年前`;
}

function getAlertIcon(type: Alert['type']) {
  switch (type) {
    case 'high_score':
      return <AlertTriangle className="w-5 h-5" />;
    case 'overdue_visit':
      return <Clock className="w-5 h-5" />;
    case 'risk_change':
      return <TrendingUp className="w-5 h-5" />;
  }
}

function getSeverityBadge(severity: Alert['severity']) {
  if (severity === 'critical') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-coral-500/20 text-coral-500">
        <XCircle className="w-3 h-3" />
        紧急
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-500">
      <Shield className="w-3 h-3" />
      警告
    </span>
  );
}

export default function Alerts() {
  const { patients, alerts, resolveAlert, addFollowUpTask } = useStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});

  const showFeedback = (alertId: string, msg: string) => {
    setActionFeedback((prev) => ({ ...prev, [alertId]: msg }));
    setTimeout(() => {
      setActionFeedback((prev) => {
        const next = { ...prev };
        delete next[alertId];
        return next;
      });
    }, 2000);
  };

  const handleAddVisit = (alert: Alert) => {
    const patient = patients.find((p) => p.id === alert.patientId);
    const task: FollowUpTask = {
      id: `FU${Date.now()}`,
      patientId: alert.patientId,
      type: 'visit',
      status: 'pending',
      scheduledDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      completedDate: null,
      result: null,
      needsExtraVisit: false,
      doctorConclusion: null,
      createdBy: '王医生',
    };
    addFollowUpTask(task);
    showFeedback(alert.id, `已为${patient?.name ?? '患者'}生成门诊随访任务`);
  };

  const handleSendReminder = (alert: Alert) => {
    const patient = patients.find((p) => p.id === alert.patientId);
    const task: FollowUpTask = {
      id: `FU${Date.now()}`,
      patientId: alert.patientId,
      type: 'sms',
      status: 'completed',
      scheduledDate: new Date().toISOString().slice(0, 10),
      completedDate: new Date().toISOString().slice(0, 10),
      result: `已发送短信提醒至${patient?.phone ?? '患者手机'}`,
      needsExtraVisit: false,
      doctorConclusion: null,
      createdBy: '王医生',
    };
    addFollowUpTask(task);
    showFeedback(alert.id, `已发送短信提醒至${patient?.name ?? '患者'}`);
  };

  const handleMakeCall = (alert: Alert) => {
    const patient = patients.find((p) => p.id === alert.patientId);
    const task: FollowUpTask = {
      id: `FU${Date.now()}`,
      patientId: alert.patientId,
      type: 'phone',
      status: 'completed',
      scheduledDate: new Date().toISOString().slice(0, 10),
      completedDate: new Date().toISOString().slice(0, 10),
      result: `已拨打电话${patient?.phone ?? ''}，患者知晓复诊安排`,
      needsExtraVisit: false,
      doctorConclusion: null,
      createdBy: '王医生',
    };
    addFollowUpTask(task);
    showFeedback(alert.id, `已记录拨打${patient?.name ?? '患者'}电话`);
  };

  const unresolvedAlerts = alerts.filter((a) => !a.isResolved);
  const resolvedAlerts = alerts.filter((a) => a.isResolved);

  const highScoreCount = unresolvedAlerts.filter((a) => a.type === 'high_score').length;
  const overdueVisitCount = unresolvedAlerts.filter((a) => a.type === 'overdue_visit').length;
  const riskChangeCount = unresolvedAlerts.filter((a) => a.type === 'risk_change').length;

  const filteredAlerts = unresolvedAlerts.filter((a) => {
    if (activeTab === 'all') return true;
    return a.type === activeTab;
  });

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient?.name ?? '未知患者';
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'high_score', label: '高分预警' },
    { key: 'overdue_visit', label: '逾期未复诊' },
    { key: 'risk_change', label: '风险变动' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="w-6 h-6 text-coral-500" />
        <h1 className="text-2xl font-bold text-white">预警看板</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-coral-500/20">
              <AlertTriangle className="w-5 h-5 text-coral-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">高分预警数</p>
              <p className="text-2xl font-bold text-white">{highScoreCount}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">逾期未复诊数</p>
              <p className="text-2xl font-bold text-white">{overdueVisitCount}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-midnight-950 border border-midnight-800/50 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-mint-500/20">
              <TrendingUp className="w-5 h-5 text-mint-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">风险变动数</p>
              <p className="text-2xl font-bold text-white">{riskChangeCount}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-midnight-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-midnight-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredAlerts.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            暂无预警信息
          </div>
        )}
        {filteredAlerts.map((alert, index) => {
          const isCritical = alert.severity === 'critical';
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-midnight-950 border border-midnight-800/50 rounded-xl overflow-hidden ${
                isCritical ? 'animate-pulse-glow' : ''
              }`}
              style={
                isCritical
                  ? {
                      borderLeftWidth: '4px',
                      borderLeftColor: '#e74c3c',
                      boxShadow: '0 0 20px rgba(231, 76, 60, 0.15)',
                    }
                  : {
                      borderLeftWidth: '4px',
                      borderLeftColor: '#f5a623',
                    }
              }
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`mt-0.5 shrink-0 ${
                        isCritical ? 'text-coral-500' : 'text-amber-500'
                      }`}
                    >
                      {alert.type === 'risk_change' ? (
                        alert.message.includes('降至') ? (
                          <TrendingDown className="w-5 h-5" />
                        ) : (
                          <TrendingUp className="w-5 h-5" />
                        )
                      ) : (
                        getAlertIcon(alert.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">
                          {getPatientName(alert.patientId)}
                        </span>
                        {getSeverityBadge(alert.severity)}
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {alert.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {getTimeAgo(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-midnight-800/50">
                  <button
                    onClick={() => handleAddVisit(alert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-midnight-800/50 text-slate-400 hover:text-white hover:bg-midnight-700/50 text-xs transition-colors"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    加号
                  </button>
                  <button
                    onClick={() => handleSendReminder(alert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-midnight-800/50 text-slate-400 hover:text-white hover:bg-midnight-700/50 text-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    发提醒
                  </button>
                  <button
                    onClick={() => handleMakeCall(alert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-midnight-800/50 text-slate-400 hover:text-white hover:bg-midnight-700/50 text-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    拨打电话
                  </button>
                  <div className="flex-1" />
                  {actionFeedback[alert.id] && (
                    <span className="text-xs text-mint-500 animate-slide-in">{actionFeedback[alert.id]}</span>
                  )}
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mint-500/10 text-mint-500 hover:bg-mint-500/20 text-xs font-medium transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    已处理
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {resolvedAlerts.length > 0 && (
        <div className="border border-midnight-800/50 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowResolved(!showResolved)}
            className="w-full flex items-center justify-between p-4 bg-midnight-950 hover:bg-midnight-800/30 transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-400">
              <CheckCircle className="w-4 h-4 text-mint-500" />
              <span className="text-sm font-medium">已处理预警</span>
              <span className="text-xs text-slate-500">({resolvedAlerts.length})</span>
            </div>
            <motion.span
              animate={{ rotate: showResolved ? 180 : 0 }}
              className="text-slate-500"
            >
              ▼
            </motion.span>
          </button>

          <motion.div
            initial={false}
            animate={{
              height: showResolved ? 'auto' : 0,
              opacity: showResolved ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-midnight-800/50">
              {resolvedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 opacity-50 border-b border-midnight-800/30 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-mint-500">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">
                          {getPatientName(alert.patientId)}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-mint-500/10 text-mint-500">
                          已处理
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 line-through leading-relaxed">
                        {alert.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        处理时间：{alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleDateString('zh-CN') : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
