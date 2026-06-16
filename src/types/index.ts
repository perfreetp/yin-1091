export interface Patient {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  phone: string;
  chiefComplaint: string;
  medicalHistory: string;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: string;
  nextVisitDate: string | null;
  status: 'active' | 'inactive';
}

export interface MedicationRecord {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
}

export interface NonPharmIntervention {
  type: 'cbti' | 'sleepHygiene' | 'relaxation' | 'other';
  description: string;
  startDate: string;
}

export interface PSQIAssessment {
  id: string;
  patientId: string;
  subjectiveQuality: number;
  sleepLatency: number;
  sleepDuration: number;
  sleepEfficiency: number;
  sleepDisturbance: number;
  hypnoticMedication: number;
  daytimeDysfunction: number;
  totalScore: number;
  complaintNotes: string;
  medications: MedicationRecord[];
  nonPharmInterventions: NonPharmIntervention[];
  recommendedVisitDate: string;
  createdAt: string;
  createdBy: string;
}

export interface FollowUpTask {
  id: string;
  patientId: string;
  type: 'phone' | 'sms' | 'visit';
  status: 'pending' | 'in_progress' | 'completed';
  scheduledDate: string;
  completedDate: string | null;
  result: string | null;
  needsExtraVisit: boolean;
  doctorConclusion: string | null;
  createdBy: string;
}

export interface Alert {
  id: string;
  patientId: string;
  type: 'high_score' | 'overdue_visit' | 'risk_change';
  severity: 'warning' | 'critical';
  message: string;
  isResolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
}
