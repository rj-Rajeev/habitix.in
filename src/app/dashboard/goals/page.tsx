import connectDb from '@/lib/db';
import Goal from '@/models/Goal';
import Link from 'next/link';

interface RoadmapStep {
  day: number;
  task: string;
}

interface GoalType {
  _id: string;
  title: string;
  duration: string;
  hoursPerDay: number;
  daysPerWeek: number;
  preferredTime: string;
  motivation: string;
  roadmap?: RoadmapStep[];
  createdAt: string;
}

export default async function AllGoalsPage() {
  await connectDb();
const rawGoals = await Goal.find().sort({ createdAt: -1 }).lean();

const goals: GoalType[] = rawGoals.map((g) => ({
  _id: String(g._id),
  title: String(g.title),
  duration: String(g.duration),
  hoursPerDay: Number(g.hoursPerDay),
  daysPerWeek: Number(g.daysPerWeek),
  preferredTime: String(g.preferredTime),
  motivation: String(g.motivation),
  roadmap: Array.isArray(g.roadmap) ? g.roadmap.map((s: any) => ({
    day: Number(s.day),
    task: String(s.task),
  })) : undefined,
  createdAt: String(g.createdAt),
}));


  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🎯 Your Goals</h1>

      {goals.length === 0 ? (
        <p className="text-gray-500">You haven’t created any goals yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => (
            <Link
              href={`/dashboard/goals/${goal._id}`}
              key={goal._id}
              className="block bg-white/50 dark:bg-slate-800/60 backdrop-blur-md p-5 rounded-xl shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold mb-2">{goal.title}</h2>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p><strong>Duration:</strong> {goal.duration}</p>
                <p><strong>Hours/day:</strong> {goal.hoursPerDay}</p>
                <p><strong>Days/week:</strong> {goal.daysPerWeek}</p>
                <p><strong>Time:</strong> {goal.preferredTime}</p>
              </div>
              <p className="mt-2 text-sm italic text-gray-500">
                Motivation: {goal.motivation.slice(0, 80)}...
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
