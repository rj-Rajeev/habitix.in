// This file sets up a simple email subscription form and admin panel UI using MUI & Tailwind
// You'll need to add backend logic to connect with a DB (e.g., MongoDB/PostgreSQL) and an email service (e.g., Resend, Nodemailer)

"use client";

import { useState } from "react";
import { Box, Container, Typography, TextField, Button, MenuItem, Select, InputLabel, FormControl } from "@mui/material";

const categories = ["Productivity", "Updates", "Offers", "All"];

export default function EmailAdminPage() {
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const handleSendEmail = async () => {
    if (!email || !message) {
      setResponse("Please fill all fields.");
      return;
    }

    try {
      // Replace with your own API route
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, category, message })
      });

      const data = await res.json();
      setResponse(data.message || "Email sent successfully");
    } catch (err) {
      setResponse("Failed to send email.");
    }
  };

  return (
    <Box className="py-16 bg-white">
      <Container maxWidth="sm">
        <Typography variant="h4" className="mb-6 text-green-700 font-bold text-center">
          📧 Email Subscription & Admin Panel
        </Typography>

        <TextField
          fullWidth
          label="Subscriber Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4"
        />

        <FormControl fullWidth className="mb-4">
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          minRows={4}
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mb-6"
        />

        <Button variant="contained" color="success" fullWidth onClick={handleSendEmail}>
          Send Email
        </Button>

        {response && (
          <Typography variant="body2" className="mt-4 text-center text-gray-700">
            {response}
          </Typography>
        )}
      </Container>
    </Box>
  );
}
