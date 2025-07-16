"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Snackbar,
} from "@mui/material";
import { motion } from "framer-motion";
import { CheckCircle2, SendHorizonal } from "lucide-react";

const HABITIX = {
  bgGradient: "bg-gradient-to-br from-[#0f172a] via-[#0b1120] to-[#020617]",
  cardBg: "bg-slate-900/90 backdrop-blur-lg",
  accent: "#34d399",
  danger: "#f87171",
};

const categories = ["Productivity", "Community Updates", "Special Offers", "All"];

export default function EmailAdminPage() {
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: "", ok: true });

  const isValid = email.trim() && message.trim();

  const handleSendEmail = async () => {
    if (!isValid) {
      setToast({ open: true, msg: "Please fill all fields.", ok: false });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/email/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, category, message }),
      });
      const data = await res.json();
      setToast({ open: true, msg: data.message || "Email sent successfully!", ok: true });
      if (res.ok) {
        setEmail("");
        setMessage("");
        setCategory("All");
      }
    } catch (_) {
      setToast({ open: true, msg: "Failed to send email. Try again later.", ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-10 text-white ${HABITIX.bgGradient}`}>
      <motion.div
        initial={{ opacity: 0, translateY: 40 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`w-full max-w-3xl grid md:grid-cols-2 gap-8 p-8 rounded-3xl shadow-xl ${HABITIX.cardBg}`}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-6 order-1 md:order-none">
          <SendHorizonal size={48} color={HABITIX.accent} />
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-400">Habitix Mailer</h1>
          <p className="text-slate-300 text-sm leading-relaxed px-2 md:px-0">
            Delight your community with curated updates—fast. Craft a message,
            choose a segment, and hit send. All without leaving Habitix.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendEmail();
          }}
          className="flex flex-col space-y-6"
        >
          <TextField
            fullWidth
            required
            type="email"
            label="Subscriber Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
            InputProps={{ style: { color: 'white' } }}
            InputLabelProps={{ style: { color: '#94a3b8' } }}
          />

          <FormControl fullWidth>
            <InputLabel style={{ color: '#94a3b8' }}>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
              style={{ color: 'white' }}
              MenuProps={{
                PaperProps: {
                  style: { backgroundColor: '#1e293b', color: 'white' },
                },
              }}
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            required
            multiline
            minRows={4}
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            variant="outlined"
            InputProps={{ style: { color: 'white' } }}
            InputLabelProps={{ style: { color: '#94a3b8' } }}
          />

          <Button
            type="submit"
            disabled={loading || !isValid}
            className={`rounded-xl py-3 font-semibold shadow-md transition-transform active:scale-95 ${
              isValid
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-slate-600 text-slate-400 cursor-not-allowed"
            }`}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendHorizonal size={20} />}
          >
            {loading ? "Sending..." : "Send Email"}
          </Button>
        </form>
      </motion.div>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.ok ? "success" : "error"}
          icon={<CheckCircle2 />}
          sx={{ width: "100%" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </div>
  );
}