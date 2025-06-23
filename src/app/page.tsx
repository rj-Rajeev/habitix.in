'use client';

import { motion } from 'framer-motion';
import { Button } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import TimerIcon from '@mui/icons-material/Timer';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import Link from 'next/link';

const features = [
  {
    icon: <RocketLaunchIcon fontSize="large" color="primary" />,
    title: 'AI-Powered Roadmaps',
    description: 'Generate clear step-by-step plans for your personal or professional goals.',
  },
  {
    icon: <EmojiObjectsIcon fontSize="large" color="warning" />,
    title: 'Smart Suggestions',
    description: 'Receive dynamic suggestions based on your current progress and habits.',
  },
  {
    icon: <TimerIcon fontSize="large" color="secondary" />,
    title: 'Productivity Tracking',
    description: 'Track your focus, sessions, and growth with intelligent analytics.',
  },
  {
    icon: <NotificationsActiveIcon fontSize="large" color="error" />,
    title: 'Adaptive Reminders',
    description: 'Get reminders that fit your routine — not random pings.',
  },
  {
    icon: <SelfImprovementIcon fontSize="large" color="success" />,
    title: 'Wellness Integration',
    description: 'Incorporate meditation, journaling, and self-care into your daily plan.',
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800 px-4 py-10 text-gray-800 dark:text-white">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto mb-16">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          Achieve Big Goals With AI Guidance
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6"
        >
          Your personal growth companion: from task tracking to deep focus and mindfulness.
        </motion.p>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Button variant="contained" size="large" className="!bg-blue-600">
            <Link href="/signin">Start Your Journey</Link>
          </Button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="rounded-2xl p-6 bg-white/30 dark:bg-white/10 backdrop-blur-md shadow-xl hover:scale-[1.03] hover:shadow-2xl transition-transform cursor-default"
          >
            <div className="mb-3">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-1">{feature.title}</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">{feature.description}</p>
          </motion.div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center mt-16 text-sm text-gray-500">
        © {new Date().getFullYear()} YourAppName. All rights reserved.
      </footer>
    </main>
  );
}
