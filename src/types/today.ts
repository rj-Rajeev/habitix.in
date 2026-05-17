export type TodayTaskCard = {
  _id: string;
  userId: string;
  goalId: string;
  title: string;
  description?: string;
  type: "execution" | "revision" | "recovery";
  status: string;
  scheduledDate: string;
  scheduledOrder: number;
  priority: string;
  estimatedMinutes: number;
  revisionOfTaskId?: string;
  completedAt?: string;
  notes?: string;
  goalTitle: string;
  isOverdue: boolean;
};

export type TodayQueue = {
  date: string;
  summary: {
    total: number;
    estimatedMinutes: number;
    overdueCount: number;
  };
  sections: {
    overdue: TodayTaskCard[];
    today: TodayTaskCard[];
    revisions: TodayTaskCard[];
  };
};
