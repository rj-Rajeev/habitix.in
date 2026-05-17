/**
 * One-time migration: sync roadmap tasks into Task collection for all goals.
 * Run: npx tsx scripts/migrate-sync-tasks.ts
 */
import mongoose from "mongoose";
import { goalSyncService } from "../src/modules/goals/goal-sync.service";
import { Goal } from "../src/modules/goals/goal.model";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI required");

  await mongoose.connect(uri);
  const goals = await Goal.find({ roadmap: { $exists: true, $ne: [] } });
  let total = 0;

  for (const goal of goals) {
    const n = await goalSyncService.syncGoalTasks(
      goal.userId,
      goal._id.toString()
    );
    total += n;
    console.log(`Synced goal ${goal._id} (+${n} tasks)`);
  }

  console.log(`Done. ${total} tasks created.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
