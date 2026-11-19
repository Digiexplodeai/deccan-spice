import { useState, type FormEvent } from "react";
import { CheckCircle2, Clock, Mail, MapPin, Phone } from "lucide-react";
import { SITE_INFO } from "../data/site";
import { DrawGoldLine, MagneticButton, RevealBlock } from "../lib/animations";
import { useCMS } from "../lib/cmsContext";

export function ContactPage() {
  const { settings } = useCMS();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("Private Dining & Catering");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const restaurantName = settings.restaurant_name || SITE_INFO.name;
  const restaurantTagline = settings.tagline || SITE_INFO.tagline;
  const address = settings.address || SITE_INFO.address;
  const center = settings.center || SITE_INFO.center;
  const phoneDisplay = settings.phone || SITE_INFO.phoneDisplay;
  const phoneHref = settings.phone ? `tel:${settings.phone.replace(/[^0-9+]/g, "")}` : SITE_INFO.phoneHref;
  const emailDisplay = settings.email || SITE_INFO.email;
  const emailHref = settings.email ? `mailto:${settings.email}` : SITE_INFO.emailHref;
  const hoursList = settings.opening_hours && settings.opening_hours.length > 0 ? settings.opening_hours : SITE_INFO.hours;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="pt-24 md:pt-32 pb-24 bg-[#10110F] text-[#FFF9F1] min-h-screen">
      <div className="luxury-container space-y-12">
        <RevealBlock className="max-w-3xl space-y-3 pb-6 border-b border-[#D9B780]/20">
          <DrawGoldLine className="w-14" origin="left" />
          <p className="text-[0.72rem] tracking-[0.22em] uppercase text-[#D9B780] font-medium">
            Visit &amp; Inquiries
          </p>
          <h1
            className="font-display font-normal leading-[1.04]"
            style={{ fontSize: "clamp(2.25rem, 4.2vw, 3.9rem)" }}
          >
            Find Us in{" "}
            <em className="italic text-[#D9B780]">{center}</em>
          </h1>
          <p className="text-[0.95rem] leading-relaxed text-[#F7F2E9]/85">
            Join us for daily lunch or dinner service, weekend buffet, or reach out
            regarding private group dining and catering.
          </p>
        </RevealBlock>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <RevealBlock className="lg:col-span-5 space-y-6">
            <div className="p-6 md:p-8 bg-[#1D1712]/65 border border-[#D9B780]/25 space-y-5">
              <div>
                <h2 className="font-display text-2xl text-[#FFF9F1]">
                  {restaurantName}
                </h2>
                <p className="text-[0.82rem] text-[#D9B780] mt-0.5">
                  {restaurantTagline} · {SITE_INFO.priceRange}
                </p>
              </div>

              <div className="space-y-3.5 text-[0.88rem] text-[#FFF9F1]">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#D9B780] shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">{center}</p>
                    <p className="text-[#F7F2E9]/80">{address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#D9B780] shrink-0 mt-1" />
                  <a
                    href={phoneHref}
                    className="font-medium hover:text-[#D9B780] underline underline-offset-4 tabular-nums"
                  >
                    {phoneDisplay}
                  </a>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#D9B780] shrink-0 mt-1" />
                  <a
                    href={emailHref}
                    className="font-medium hover:text-[#D9B780] underline underline-offset-4"
                  >
                    {emailDisplay}
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-[#D9B780]/20 space-y-2.5">
                <div className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.14em] text-[#D9B780] font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{SITE_INFO.opensDaily}</span>
                </div>
                <dl className="space-y-1.5 text-[0.82rem] tabular-nums">
                  {hoursList.map((row) => (
                    <div key={row.days} className="flex justify-between gap-4">
                      <dt className="font-medium text-[#FFF9F1]">{row.days}</dt>
                      <dd className="text-[#F7F2E9]/80 text-right">
                        {row.lunch} · {row.dinner}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </RevealBlock>

          <RevealBlock delay={0.1} className="lg:col-span-7">
            <div className="p-6 md:p-9 bg-[#12352B]/45 border border-[#D9B780]/25">
              {submitted ? (
                <div className="py-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#D9B780] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h2 className="font-display text-2xl text-[#FFF9F1]">
                        Inquiry Received
                      </h2>
                      <p className="text-[0.88rem] text-[#F7F2E9]/85">
                        Thank you, {name}. Our hospitality team will follow up at{" "}
                        {email}, or call{" "}
                        <a
                          href={SITE_INFO.phoneHref}
                          className="underline text-[#D9B780] tabular-nums"
                        >
                          {SITE_INFO.phoneDisplay}
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setMessage("");
                    }}
                    className="px-6 py-2.5 bg-[#D9B780] text-[#10110F] text-[0.78rem] uppercase tracking-[0.08em] font-medium min-h-[44px]"
                  >
                    Send Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="font-display text-2xl text-[#FFF9F1]">
                    Send an Inquiry
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block space-y-1">
                      <span className="text-[0.74rem] font-medium text-[#F7F2E9]">
                        Name
                      </span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        className="w-full px-3.5 py-2.5 bg-[#10110F] border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[0.74rem] font-medium text-[#F7F2E9]">
                        Phone
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(954) 555-0199"
                        className="w-full px-3.5 py-2.5 bg-[#10110F] border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] tabular-nums focus:outline-none focus:border-[#D9B780]"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block space-y-1">
                      <span className="text-[0.74rem] font-medium text-[#F7F2E9]">
                        Email
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3.5 py-2.5 bg-[#10110F] border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[0.74rem] font-medium text-[#F7F2E9]">
                        Topic
                      </span>
                      <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#10110F] border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                      >
                        <option value="Private Dining & Catering">
                          Private Dining &amp; Catering
                        </option>
                        <option value="Large Group Reservation">
                          Large Group Reservation
                        </option>
                        <option value="Dietary & Allergen Question">
                          Dietary &amp; Allergen Question
                        </option>
                        <option value="General Feedback">General Feedback</option>
                      </select>
                    </label>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-[0.74rem] font-medium text-[#F7F2E9]">
                      Message
                    </span>
                    <textarea
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Event date, guest count, or question..."
                      className="w-full px-3.5 py-2.5 bg-[#10110F] border border-[#D9B780]/30 text-[0.86rem] text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                    />
                  </label>

                  <MagneticButton
                    type="submit"
                    className="px-7 py-3 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780]/55 text-[#FFF9F1] text-[0.78rem] font-medium tracking-[0.1em] uppercase transition-colors min-h-[44px]"
                  >
                    Send Message
                  </MagneticButton>
                </form>
              )}
            </div>
          </RevealBlock>
        </div>
      </div>
    </div>
  );
}
