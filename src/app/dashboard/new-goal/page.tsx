'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function NewGoalPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    hoursPerDay: '',
    preferredTime: '',
    daysPerWeek: '',
    motivation: '',
  });

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      const res = await axios.post('/api/goals', formData);
      router.push(`/dashboard/goals/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to save goal.');
    }
  };



  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Create a New Goal</h2>

      {step === 1 && (
        <div className="space-y-4">
          <input name="title" placeholder="Goal Title" value={formData.title} onChange={handleChange} className="input" />
          <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="input" />
          <button onClick={nextStep} className="btn-primary">Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <input type="date" name="targetDate" value={formData.targetDate} onChange={handleChange} className="input" />
          <input type="time" name="preferredTime" value={formData.preferredTime} onChange={handleChange} className="input" />
          <input type="number" name="hoursPerDay" placeholder="Hours/Day" value={formData.hoursPerDay} onChange={handleChange} className="input" />
          <input type="number" name="daysPerWeek" placeholder="Days/Week" value={formData.daysPerWeek} onChange={handleChange} className="input" />
          <div className="flex justify-between">
            <button onClick={prevStep} className="btn-secondary">Back</button>
            <button onClick={nextStep} className="btn-primary">Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <textarea name="motivation" placeholder="Why do you want this?" value={formData.motivation} onChange={handleChange} className="input" />
          <div className="flex justify-between">
            <button onClick={prevStep} className="btn-secondary">Back</button>
            <button onClick={handleSubmit} className="btn-primary">Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}
