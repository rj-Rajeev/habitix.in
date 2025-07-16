import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">
        At <strong>Habitix</strong>, your privacy is very important to us. This Privacy Policy explains how we
        collect, use, and protect your information when you use our app.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
      <p className="mb-4">
        We collect the minimum data necessary to provide our services, including:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>Email address (for login and syncing your progress)</li>
        <li>Task, goal, and habit data you voluntarily add</li>
        <li>Device information (for improving performance and support)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
      <ul className="list-disc list-inside mb-4">
        <li>To save and sync your progress across devices</li>
        <li>To personalize your experience and reminders</li>
        <li>To improve our app performance and user experience</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Sharing</h2>
      <p className="mb-4">
        We do <strong>not</strong> sell your data. We may share data with third-party services strictly for app functionality
        (like cloud storage, push notifications, or analytics), all of which comply with privacy standards.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Security</h2>
      <p className="mb-4">
        We implement standard security measures to protect your data. However, no online system is 100% secure.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Your Rights</h2>
      <p className="mb-4">
        You can delete your data anytime by contacting support or using in-app features (where available).
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Changes to This Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy occasionally. We encourage users to review it regularly. Continued use of
        Habitix means you agree to the latest version.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Contact Us</h2>
      <p>
        If you have any questions or concerns, contact us at:
        <br />
        <a
          href="mailto:habitix.in@gmail.com"
          className="text-blue-600 underline hover:text-blue-800"
        >
          habitix.in@gmail.com
        </a>
      </p>
    </div>
  );
}
