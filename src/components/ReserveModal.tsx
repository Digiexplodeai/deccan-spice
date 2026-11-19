import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, CheckCircle2, Clock, Phone, Users, X } from "lucide-react";
import { SITE_INFO } from "../data/site";

interface ReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIME_SLOTS = [
  "11:30 AM (Lunch)",
  "12:30 PM (Lunch)",
  "1:30 PM (Lunch)",
  "5:30 PM (Dinner)",
  "6:30 PM (Dinner)",
  "7:30 PM (Dinner)",
  "8:30 PM (Dinner)",
];

export function ReserveModal({ isOpen, onClose }: ReserveModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState("2");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(TIME_SLOTS[4]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("Please provide your name, phone number, and email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setConfirmationCode(`DS-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const resetAndClose = () => {
    setConfirmationCode(null);
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="reserve-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reserve-modal-title"
          onClick={resetAndClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl bg-[#10110F] text-[#FFF9F1] border border-[#D9B780]/45 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#12352B] border-b border-[#D9B780]/25 flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[#D9B780] font-medium">
                  {SITE_INFO.center} · Pompano Beach
                </p>
                <h2
                  id="reserve-modal-title"
                  className="font-display text-2xl mt-0.5 text-[#FFF9F1]"
                >
                  Reserve a Table
                </h2>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="w-11 h-11 border border-[#D9B780]/35 flex items-center justify-center text-[#FFF9F1] hover:border-[#D9B780] transition-colors"
                aria-label="Close reservation dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {confirmationCode ? (
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-start gap-3.5 p-5 bg-[#12352B]/70 border border-[#D9B780]/40">
                  <CheckCircle2 className="w-6 h-6 text-[#D9B780] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-display text-xl text-[#FFF9F1]">
                      Reservation Confirmed
                    </p>
                    <p className="text-[0.85rem] text-[#F7F2E9]">
                      Reference{" "}
                      <span className="font-medium text-[#D9B780] tabular-nums">
                        {confirmationCode}
                      </span>{" "}
                      · {guests} {Number(guests) === 1 ? "Guest" : "Guests"} on{" "}
                      {date} at {time}.
                    </p>
                  </div>
                </div>

                <div className="text-[0.84rem] text-[#F7F2E9]/85 space-y-1.5 border-t border-[#D9B780]/20 pt-4">
                  <p>
                    <strong className="text-[#FFF9F1] font-medium">Address:</strong>{" "}
                    {SITE_INFO.address}
                  </p>
                  <p>
                    <strong className="text-[#FFF9F1] font-medium">
                      Need adjustments?
                    </strong>{" "}
                    Call{" "}
                    <a
                      href={SITE_INFO.phoneHref}
                      className="text-[#D9B780] underline underline-offset-4 tabular-nums"
                    >
                      {SITE_INFO.phoneDisplay}
                    </a>
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="px-6 py-2.5 bg-[#D9B780] text-[#10110F] text-[0.78rem] uppercase tracking-[0.08em] font-medium min-h-[44px]"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 md:p-7 space-y-4">
                {error && (
                  <div className="p-3 bg-[#811C36]/40 border border-[#D9B780]/40 text-[0.82rem] text-[#FFF9F1]">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <label className="block space-y-1">
                    <span className="flex items-center gap-1.5 text-[0.74rem] font-medium text-[#F7F2E9]">
                      <Users className="w-3.5 h-3.5 text-[#D9B780]" /> Guests
                    </span>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#1D1712]/70 border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                        <option key={n} value={n} className="bg-[#10110F]">
                          {n} {n === 1 ? "Guest" : "Guests"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="flex items-center gap-1.5 text-[0.74rem] font-medium text-[#F7F2E9]">
                      <Calendar className="w-3.5 h-3.5 text-[#D9B780]" /> Date
                    </span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2.5 bg-[#1D1712]/70 border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] tabular-nums focus:outline-none focus:border-[#D9B780]"
                      required
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="flex items-center gap-1.5 text-[0.74rem] font-medium text-[#F7F2E9]">
                      <Clock className="w-3.5 h-3.5 text-[#D9B780]" /> Seating
                    </span>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#1D1712]/70 border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot} className="bg-[#10110F]">
                          {slot}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <label className="block space-y-1">
                    <span className="text-[0.74rem] font-medium text-[#F7F2E9]">
                      Full Name
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Guest name"
                      className="w-full px-3 py-2.5 bg-[#1D1712]/70 border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                      required
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[0.74rem] font-medium text-[#F7F2E9]">
                      Phone Number
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(954) 555-0199"
                      className="w-full px-3 py-2.5 bg-[#1D1712]/70 border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] tabular-nums focus:outline-none focus:border-[#D9B780]"
                      required
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-[0.74rem] font-medium text-[#F7F2E9]">
                    Email Address
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 bg-[#1D1712]/70 border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                    required
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-[0.74rem] font-medium text-[#F7F2E9]">
                    Occasion or Dietary Notes (Optional)
                  </span>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Booth preference, celebration, allergies..."
                    className="w-full px-3 py-2.5 bg-[#1D1712]/70 border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </label>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#D9B780]/20">
                  <a
                    href={SITE_INFO.phoneHref}
                    className="inline-flex items-center gap-1.5 text-[0.8rem] text-[#F7F2E9] hover:text-[#D9B780] tabular-nums min-h-[44px]"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#D9B780]" />
                    {SITE_INFO.phoneDisplay}
                  </a>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780]/55 text-[#FFF9F1] text-[0.78rem] font-medium tracking-[0.1em] uppercase transition-colors min-h-[44px]"
                  >
                    Confirm Reservation
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
