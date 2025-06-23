// types/goal.ts
export interface GoalData {
  title: string;
  duration: string;
  hoursPerDay: number;
  daysPerWeek: number;
  preferredTime: string;
  motivation: string;
}

export interface RoadmapStep {
  day: number;
  task: string;
}
