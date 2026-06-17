import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Terminal, ShieldAlert, Phone } from "lucide-react";
import AuthPanel from "@/components/AuthPanel";
import CountdownTimer from "@/components/CountdownTimer";
import InteractiveBackground from "@/components/InteractiveBackground";
import IntroAnimation from "@/components/IntroAnimation";
import Navbar from "@/components/Navbar";
import DomainTimeline from "@/components/DomainTimeline";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const sponsorSlots = [
  { slot: "Sponsor 1", desc: "sponsor 1 description" },
  { slot: "Sponsor 2", desc: "sponsor 2 description" },
  { slot: "Sponsor 3", desc: "sponsor 3 description" },
  { slot: "Sponsor 4", desc: "sponsor 4 description" },
];

const faqs = [
  {
    question: "FAQ QUESTION 1",
    answer:
      "LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISICING ELIT. TOTAM FACILIS EUM DOLORE ID. CONSECTETUR, INCIDUNT, NOBIS ACCUSAMUS EA NULLA PROVIDENT RECUSANDAE VELIT CUPIDITATE OMNIS OPTIO PERSPICIATIS CORRUPTI REPUDIANDAE EXPLICABO IPSAM!",
  },
  {
    question: "FAQ QUESTION 2",
    answer:
      "LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISICING ELIT. TOTAM FACILIS EUM DOLORE ID. CONSECTETUR, INCIDUNT, NOBIS ACCUSAMUS EA NULLA PROVIDENT RECUSANDAE VELIT CUPIDITATE OMNIS OPTIO PERSPICIATIS CORRUPTI REPUDIANDAE EXPLICABO IPSAM!",
  },
  {
    question: "FAQ QUESTION 3",
    answer:
      "LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISICING ELIT. TOTAM FACILIS EUM DOLORE ID. CONSECTETUR, INCIDUNT, NOBIS ACCUSAMUS EA NULLA PROVIDENT RECUSANDAE VELIT CUPIDITATE OMNIS OPTIO PERSPICIATIS CORRUPTI REPUDIANDAE EXPLICABO IPSAM!",
  },
  {
    question: "FAQ QUESTION 4",
    answer:
      "LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISICING ELIT. TOTAM FACILIS EUM DOLORE ID. CONSECTETUR, INCIDUNT, NOBIS ACCUSAMUS EA NULLA PROVIDENT RECUSANDAE VELIT CUPIDITATE OMNIS OPTIO PERSPICIATIS CORRUPTI REPUDIANDAE EXPLICABO IPSAM!",
  },
];

export default function HomePage() {
  const [introDone, setIntroDone] = useState(false);
  const handleIntroDone = useCallback(() => setIntroDone(true), []);
  const { user } = useAuthStore();
  const showAuthPanel = !user;

  return (
    <div className="min-h-screen overflow-x-hidden text-white font-terminal selection:bg-primary selection:text-white">
      {!introDone && <IntroAnimation onComplete={handleIntroDone} />}
      <InteractiveBackground />
      <Navbar />

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section
          id="home"
          className={`container grid min-h-[calc(100vh-4rem)] items-center gap-10 py-12 ${showAuthPanel ? "lg:grid-cols-[1.1fr_0.9fr]" : ""}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: introDone ? 0.1 : 3.2 }}
            className="max-w-2xl font-terminal"
          >
            <p className="mb-4 inline-flex items-center gap-1.5 rounded border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary text-neon-pink">
              <Terminal className="h-3.5 w-3.5 animate-pulse" />
              Learn Today, Lead Tomorrow
            </p>
            <h1 className="font-display text-6xl font-bold leading-none tracking-tight text-white sm:text-8xl">
              BUILD<span className="text-primary text-neon-pink">X</span>
            </h1>
            <p className="mt-5 text-balance text-sm leading-relaxed text-muted-foreground uppercase sm:text-base">
              BuildX is an 11-day multi domain tech bootcamp where you learn by building real world projects and showcase them.
            </p>
            
            {/* <div className="mt-8 flex flex-wrap gap-3 font-terminal">
              <Button asChild size="lg" className="retro-btn-pink font-bold uppercase tracking-widest">
                {showAuthPanel ? <a href="#auth">CONNECT_PORTAL</a> : <a href="#about">EXPLORE_EVENT</a>}
              </Button>
              <Button asChild size="lg" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10 hover:shadow-neon-cyan font-bold uppercase tracking-widest bg-transparent">
                <a href="#about">EXAMINE_SPECS</a>
              </Button>
            </div> */}
            
            {/* Nixie Tube Clock */}
            <div className="mt-10 max-w-xl">
              <div className="mb-2 text-xs font-bold text-secondary uppercase tracking-widest text-neon-cyan">LAUNCH_COUNTDOWN</div>
              <CountdownTimer />
            </div>
          </motion.div>

          {/* AUTH PANEL TABBED INTERFACE */}
          {showAuthPanel ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: introDone ? 0.2 : 3.35 }}
            >
              <AuthPanel />
            </motion.div>
          ) : null}
        </section>

        {/* DETAILS SECTION */}
        <section id="about" className="border-y border-primary/20 bg-[#090812]/92 py-20 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,127,0.05),transparent_60%)] pointer-events-none" />
          <div className="container grid gap-8 lg:grid-cols-[1fr_1.2fr_0.8fr] relative z-10 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary text-neon-pink">MISSION_OBJECTIVE</p>
              <h2 className="font-display text-4xl font-bold text-white mt-1">ABOUT BUILDX</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground uppercase">
                about buildx section 1
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground uppercase">
                about buildx section 2
              </p>
            </div>
            <div className="flex justify-center">
              <img src="/images/cobit_logo.png" alt="cobit logo" className="w-48 h-48 border border-primary/30 rounded shadow-pink object-cover" />
            </div>
          </div>
        </section>

        {/* TIMELINE SECTION */}
        <section id="timeline" className="container py-20">
          <div className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-secondary text-neon-cyan">BOOTCAMP_DOMAINS</p>
            <h2 className="font-display text-4xl font-bold text-white mt-1">THE TIMELINE</h2>
          </div>
          <DomainTimeline />
        </section>

        {/* PARTNERS / SPONSORS SECTION */}
        <section id="sponsors" className="bg-[#0b0914] border-y border-primary/20 py-20 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(0,255,255,0.04),transparent_50%)] pointer-events-none" />
          <div className="container relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-secondary text-neon-cyan text-center">SPONSOR_ALLIANCE</p>
            <h2 className="mt-1 font-display text-4xl font-bold text-white text-center mb-10">SUPPORTING HOSTS</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sponsorSlots.map((slot) => (
                <div key={slot.slot} className="rounded border border-secondary/20 bg-[#07060c] p-5 hover:border-secondary transition-all duration-300">
                  <div className="grid aspect-[4/3] place-items-center rounded bg-[#0f0e20] border border-dashed border-secondary/30 font-pixel text-3xl text-secondary/30 font-bold uppercase">
                    SPONSOR_IMAGE
                  </div>
                  <p className="mt-4 font-bold text-white tracking-widest uppercase text-sm">{slot.slot}</p>
                  <p className="text-xs text-muted-foreground uppercase mt-1">{slot.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT & FAQS SECTION */}
        <section id="contactus" className="container py-20 space-y-12">
          {/* Section Header */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-primary text-neon-pink">Contact BUILDX</p>
            <h2 className="font-display text-4xl font-bold text-white">CONTACT US</h2>
            <p className="text-xs text-muted-foreground uppercase leading-relaxed max-w-xl">
              Reach out directly to organizers for instant support or consult the Frequently Asked Questions.
            </p>
          </div>

          {/* Core Team Organizers list */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Samyak */}
            <div className="rounded border border-secondary/20 bg-[#090812]/80 p-5 hover:border-secondary hover:shadow-cyan transition duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white tracking-widest uppercase text-base">Samyak</h3>
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-wider text-neon-cyan">Founder</span>
                </div>
              </div>
              <div className="space-y-4">
                <a 
                  href="https://wa.me/7376429353" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#0c0a1a] border border-secondary/20 hover:border-secondary p-2.5 rounded text-white font-bold transition uppercase text-xs"
                >
                  <Phone className="h-4 w-4 text-secondary text-neon-cyan" />
                  <span>WHATSAPP: 7376429353</span>
                </a>
                <div className="flex gap-2">
                  <a href="https://www.instagram.com/py.ssp" target="_blank" rel="noopener noreferrer" className="flex-1 grid h-9 place-items-center bg-[#0e0920] border border-primary/20 hover:border-primary hover:text-primary hover:shadow-neon-pink rounded text-muted-foreground transition" title="Instagram Link"><InstagramIcon /></a>
                  <a href="https://www.linkedin.com/in/sampy/" target="_blank" rel="noopener noreferrer" className="flex-1 grid h-9 place-items-center bg-[#0c0a1a] border border-[#31baf5]/20 hover:border-[#31baf5] hover:text-[#31baf5] hover:shadow-neon-cyan rounded text-muted-foreground transition" title="LinkedIn Link"><LinkedinIcon /></a>
                  <a href="https://github.com/Ssp64" target="_blank" rel="noopener noreferrer" className="flex-1 grid h-9 place-items-center bg-[#07050d] border border-muted/30 hover:border-white hover:text-white rounded text-muted-foreground transition" title="GitHub Link"><GithubIcon /></a>
                </div>
              </div>
            </div>

            {/* Marsad */}
            <div className="rounded border border-secondary/20 bg-[#090812]/80 p-5 hover:border-secondary hover:shadow-cyan transition duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white tracking-widest uppercase text-base">Marsad</h3>
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-wider text-neon-cyan">Coordinator</span>
                </div>
              </div>
              <div className="space-y-4">
                <a 
                  href="https://wa.me/7238941901" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#0c0a1a] border border-secondary/20 hover:border-secondary p-2.5 rounded text-white font-bold transition uppercase text-xs"
                >
                  <Phone className="h-4 w-4 text-secondary text-neon-cyan" />
                  <span>WHATSAPP: 7238941901</span>
                </a>
                <div className="flex gap-2">
                  <a href="https://www.instagram.com/i.ami_sayeed_080" target="_blank" rel="noopener noreferrer" className="flex-1 grid h-9 place-items-center bg-[#0e0920] border border-primary/20 hover:border-primary hover:text-primary hover:shadow-neon-pink rounded text-muted-foreground transition" title="Instagram Link"><InstagramIcon /></a>
                  <a href="https://www.linkedin.com/in/marsad-sayeed-bhu/" target="_blank" rel="noopener noreferrer" className="flex-1 grid h-9 place-items-center bg-[#0c0a1a] border border-[#31baf5]/20 hover:border-[#31baf5] hover:text-[#31baf5] hover:shadow-neon-cyan rounded text-muted-foreground transition" title="LinkedIn Link"><LinkedinIcon /></a>
                </div>
              </div>
            </div>
          </div>

          {/* Management Staff Grid */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              { name: "Riddhima", role: "Management", phone: "9520924488" },
              { name: "Risha", role: "Management", phone: "8090055830" },
              { name: "Priya", role: "Management", phone: "9236861954" },
              { name: "Rajneesh", role: "Management", phone: "7307546488" }
            ].map((m) => (
              <div key={m.name} className="rounded border border-primary/20 bg-[#090812]/80 p-4 hover:border-primary hover:shadow-pink transition duration-300 text-left">
                <h4 className="font-bold text-white uppercase text-sm">{m.name}</h4>
                <p className="text-[9px] text-primary font-bold uppercase text-neon-pink mt-0.5">{m.role}</p>
                <a 
                  href={`tel:${m.phone}`}
                  className="flex items-center justify-center gap-1.5 bg-[#090812] border border-primary/15 hover:border-primary p-2 rounded text-[10px] text-white font-bold transition uppercase mt-3"
                >
                  <Phone className="h-3 w-3 text-primary text-neon-pink" />
                  <span>CALL: {m.phone}</span>
                </a>
              </div>
            ))}
          </div>

          {/* FAQs Accoridon */}
          <div className="pt-8 border-t border-primary/10">
            <h3 className="font-display text-2xl font-bold text-white mb-4 text-left">FREQUENTLY_ASKED_QUESTIONS</h3>
            <Accordion type="single" collapsible className="rounded border border-primary/20 bg-[#090812]/90 px-6 py-2">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`} className="border-b border-primary/10 last:border-none py-1">
                  <AccordionTrigger className="text-sm font-bold hover:text-secondary hover:no-underline tracking-wider uppercase text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-xs leading-relaxed text-muted-foreground uppercase pt-2">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-primary/20 bg-[#090812] py-12 relative z-10 font-terminal">
        <div className="container grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="font-display text-2xl font-bold text-white flex items-center gap-2 text-neon-pink">
              <img src="/images/cobit_logo.png" alt="Cobit labs Logo" className="h-8 w-8 object-contain" />
              BUILDX
            </div>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground uppercase">
              cobit labs @ 2026. All Rights Reserved.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-accent">
              <ShieldAlert className="h-4 w-4 text-accent animate-pulse" />
              <Link to="/admin/login" className="hover:underline tracking-widest uppercase font-bold text-neon-violet">
                SECURE_ADMIN_LOGIN
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-secondary uppercase tracking-widest text-sm mb-4">Navigate</h3>
            <div className="grid gap-2 text-xs text-muted-foreground uppercase">
              <Link to="/#home" className="hover:text-white transition">GOTO_HOME</Link>
              <Link to="/#timeline" className="hover:text-white transition">GOTO_TIMELINE</Link>
              <Link to="/#sponsors" className="hover:text-white transition">GOTO_SPONSORS</Link>
              <Link to="/#contactus" className="hover:text-white transition">GOTO_CONTACTS</Link>
            </div>
          </div>
          {/* <div>
            <h3 className="font-bold text-primary uppercase tracking-widest text-sm mb-4">COMMS_LINK</h3>
            <div className="flex gap-2">
              {[AtSign, ExternalLink, Send, Mail].map((Icon, index) => (
                <a
                  key={index}
                  href="#contact"
                  className="grid h-10 w-10 place-items-center rounded border border-primary/30 bg-[#0d0c1b] text-primary transition hover:bg-primary hover:text-white hover:shadow-neon-pink"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div> */}
        </div>
      </footer>
    </div>
  );
}
