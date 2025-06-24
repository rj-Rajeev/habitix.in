🧠 TrackNest — Development Roadmap

This document outlines the complete roadmap to build TrackNest, an AI-powered, gamified task and goal tracking platform.


---

✅ PHASE 1: Core MVP (By June 27)

🔐 Authentication Setup

[x] Email/Password login using NextAuth.js

[x] MongoDB user storage

[x] Sign Up / Sign In / Dashboard routing


🧠 Goal Creation + GPT Integration

[x] Goal creation form (title, duration, category, etc.)

[x] GPT prompt flow to ask goal-related questions

[x] Generate daily roadmap via GPT (tasks per day)

[x] Save goal + roadmap to MongoDB


🛣️ Gamified Roadmap UI

[ ] Bubble-style level map (days as clickable bubbles)

[ ] Day 1 starts unlocked, next day unlocks only after completion

[ ] Responsive scrollable/curved UI


✅ Daily Task View

[ ] Show tasks per selected day (modal or /day/[n])

[ ] Mark tasks as complete (checkbox/toggle)

[ ] Save completion status to MongoDB

[ ] Unlock next day only after all tasks complete


⭐ Stars + Daily Rewards

[ ] 1 star per task completed

[ ] 3 stars = full completion

[ ] Reward prompt UI: "You can eat your favorite snack!"

[ ] Save stars to profile


📸 Proof of Work Upload

[ ] After completing all tasks, prompt for image upload

[ ] Save proof with day, goalId, image URL, optional notes


🖼️ Proof Gallery Page

[ ] Page: /dashboard/proofs

[ ] Grid view of all proof uploads

[ ] Filter by goal/date

[ ] Display stars + notes


💬 Comment System (Optional for MVP)

[ ] Allow users to add comments on proof uploads

[ ] Store and display per proof


🔔 Push Notification Logic (Stub for MVP)

[ ] Users set daily work time (e.g., 7–9 AM)

[ ] Stub logic for reminders:

30 min before

Session start

Every 30 mins until done


[ ] Use toast or setInterval for now (no real push infra)



---

🧱 PHASE 2: Post-MVP Expansion

🧠 Smart Goal Validation

[ ] Check if goal is unrealistic (e.g., 10kg in 10 days)

[ ] Suggest realistic duration

[ ] Offer short and full roadmap options


📤 Social Sharing

[ ] Generate a shareable image with stats + proof

[ ] Share to Instagram, WhatsApp, Facebook


📊 Dashboard Enhancements

[ ] Show streaks, stars earned, daily progress

[ ] GitHub-style heatmap of activity


📈 Admin Analytics

[ ] Daily active users

[ ] Goals created vs. completed

[ ] Popular goals and categories



---

🔧 Backend Enhancements (Future Scaling)

Feature	Tech Suggestion

Caching GPT responses	Redis
Scalable DB option	PostgreSQL or MySQL
Real-time task updates	WebSockets or Firebase
Push Notifications	FCM / OneSignal



---

📦 Current Tech Stack

Layer	Stack

Frontend	Next.js (App Router), Tailwind, MUI, TypeScript
Backend	Node.js, OpenAI GPT
Auth	NextAuth.js
Database	MongoDB (future: PostgreSQL + Redis)
Storage	S3/local image upload
Notifications	Planned via FCM/OneSignal



---