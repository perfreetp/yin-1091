import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Patient, PSQIAssessment, FollowUpTask, Alert } from '@/types';
import { patients as mockPatients, assessments as mockAssessments, followUpTasks as mockFollowUpTasks, alerts as mockAlerts } from '@/data/mockData';

interface ClinicStore {
  patients: Patient[];
  assessments: PSQIAssessment[];
  followUpTasks: FollowUpTask[];
  alerts: Alert[];

  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, data: Partial<Patient>) => void;

  addAssessment: (assessment: PSQIAssessment) => void;
  getPatientAssessments: (patientId: string) => PSQIAssessment[];

  addFollowUpTask: (task: FollowUpTask) => void;
  updateFollowUpTask: (id: string, data: Partial<FollowUpTask>) => void;

  addAlert: (alert: Alert) => void;
  resolveAlert: (id: string) => void;

  getRiskLevel: (score: number) => 'low' | 'medium' | 'high';
}

export const useStore = create<ClinicStore>()(
  persist(
    (set, get) => ({
      patients: mockPatients,
      assessments: mockAssessments,
      followUpTasks: mockFollowUpTasks,
      alerts: mockAlerts,

      addPatient: (patient) =>
        set((state) => ({ patients: [...state.patients, patient] })),

      updatePatient: (id, data) =>
        set((state) => ({
          patients: state.patients.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),

      addAssessment: (assessment) =>
        set((state) => ({ assessments: [...state.assessments, assessment] })),

      getPatientAssessments: (patientId) =>
        get().assessments.filter((a) => a.patientId === patientId),

      addFollowUpTask: (task) =>
        set((state) => ({ followUpTasks: [...state.followUpTasks, task] })),

      updateFollowUpTask: (id, data) =>
        set((state) => ({
          followUpTasks: state.followUpTasks.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),

      addAlert: (alert) =>
        set((state) => ({ alerts: [...state.alerts, alert] })),

      resolveAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, isResolved: true, resolvedAt: new Date().toISOString() } : a
          ),
        })),

      getRiskLevel: (score) => {
        if (score <= 5) return 'low';
        if (score <= 10) return 'medium';
        return 'high';
      },
    }),
    {
      name: 'sleep-clinic-storage',
    }
  )
);
