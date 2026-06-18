import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Gamepad2, Brain, Trophy, X, Calendar, Flame, BookOpen, User, Terminal, ArrowRight, Shield } from "lucide-react";

type DomainKey = "web" | "game" | "ai" | "hackathon";

const domainData = {
  web: {
    title: "Web Development",
    icon: Code,
    color: "border-neon-pink text-neon-pink shadow-neon-pink/15",
    accentBg: "bg-neon-pink/10",
    glowColor: "shadow-pink",
    mentor: {
      name: "Samyak",
      role: "Founder & Fullstack Architect",
      avatar: "/images/samyak_avatar.png",
      bio: "Samyak is the founder of BuildX and a seasoned fullstack engineer. He specializes in distributed systems, real-time synchronization, and building highly scalable developer ecosystems. When not programming, he enjoys configuring retro arcade cabinets and listening to synthwave."
    },
    days: {
      day1: {
        title: "Modern Client Architectures",
        curriculum: "Establish a robust React frontend layout powered by Zustand global stores, client routing, and complex Framer Motion transitions.",
        topics: [
          "React 19 & Concurrent Rendering Protocols",
          "Zustand State Stores & Sync Layers",
          "Tailwind CSS Layout systems & Custom themes",
          "Framer Motion shared layout animations"
        ]
      },
      day2: {
        title: "Real-time Backend Systems",
        curriculum: "Architect a robust backend console using Node.js, Prisma ORM, JWT authentication, and bi-directional Socket.IO WebSockets pipelines.",
        topics: [
          "Node.js & Express REST Controllers",
          "Prisma DB schemas & PostgreSQL integrations",
          "Socket.IO connection handshake & event managers",
          "Secure file upload handlers (Multer)"
        ]
      }
    }
  },
  game: {
    title: "Game Development",
    icon: Gamepad2,
    color: "border-neon-cyan text-neon-cyan shadow-neon-cyan/15",
    accentBg: "bg-neon-cyan/10",
    glowColor: "shadow-cyan",
    mentor: {
      name: "Marsad",
      role: "Game Designer & Coordinator",
      avatar: "/images/marsad_avatar.png",
      bio: "Marsad is the lead game developer and event coordinator. He has built several browser-native arcade platforms and pixel-perfect physics engines. He is dedicated to helping developers cross the boundary between standard rendering and high-performance game loops."
    },
    days: {
      day1: {
        title: "Arcade Engine & Physics Loops",
        curriculum: "Build a responsive 2D canvas arcade engine featuring precise collision detection, rigid-body physics, and interactive input event loops.",
        topics: [
          "HTML5 Canvas API context handlers",
          "Fixed-timestep game loops (requestAnimationFrame)",
          "Vector arithmetic & elastic collision math",
          "Keyboard, mouse, and game controllers bindings"
        ]
      },
      day2: {
        title: "Audio Synthesis & Sprite Rendering",
        curriculum: "Optimize memory rendering using sprite sheets, build a particle engine for visual FX, and program audio FX using the Web Audio API.",
        topics: [
          "Sprite sheets rendering & frame sheet buffers",
          "Web Audio API oscillator synthesizers",
          "High-performance particle systems",
          "Persistent client-side highscore files serialization"
        ]
      }
    }
  },
  ai: {
    title: "AI / ML",
    icon: Brain,
    color: "border-neon-violet text-[#a855f7] shadow-neon-violet/15",
    accentBg: "bg-purple-500/10",
    glowColor: "shadow-glow",
    mentor: {
      name: "Riddhima",
      role: "AI Research Scientist",
      avatar: "/images/riddhima_avatar.png",
      bio: "Riddhima is a machine learning researcher focused on client-side LLM models, conversational UX architectures, and browser-native neural net execution. She believes that the next generation of software will utilize local intelligence layers to enhance accessibility."
    },
    days: {
      day1: {
        title: "Browser Neural Networks",
        curriculum: "Compile and run deep learning models client-side with TensorFlow.js. Setup data preprocessing pipelines and monitor model training.",
        topics: [
          "TensorFlow.js execution contexts & tensor memory",
          "Designing feed-forward neural networks",
          "Optimization algorithms & cost function analytics",
          "Real-time webcam dataset collection & processing"
        ]
      },
      day2: {
        title: "LLMs & RAG Architectures",
        curriculum: "Connect web applications to deep linguistic networks. Build context-aware vector retrieval models (RAG) and optimize agent pipelines.",
        topics: [
          "OpenAI API & Hugging Face local transformers",
          "Vector databases & similarity search metrics",
          "Client-side RAG pipeline construction",
          "Designing context-aware autonomous agents"
        ]
      }
    }
  },
  hackathon: {
    title: "Hackathon Track",
    icon: Trophy,
    color: "border-neon-pink text-neon-pink shadow-neon-pink/15",
    accentBg: "bg-neon-pink/10",
    glowColor: "shadow-pink",
    problemStatements: [
      {
        track: "Web Development Track",
        title: "Multiplayer Retro Arcade Portal",
        desc: "Design and implement a multi-lobby arcade platform featuring real-time WebSockets synchronization, JWT secure cookies authorization, and automated file verification for player profiles."
      },
      {
        track: "Game Development Track",
        title: "80s Canvas Retrowave Shooter",
        desc: "Construct a canvas-based 80s themed retro arcade game featuring custom sound synthesizers, complex enemy patterns, particle animations, and local scores serialization."
      },
      {
        track: "AI / ML Track",
        title: "Local Adaptive Game Assistant",
        desc: "Integrate a client-side vector database and LLM pipeline that dynamically generates retro levels or adapts game difficulties based on player movement telemetry."
      }
    ],
    schedule: {
      day1: [
        { time: "09:00 AM", title: "PORTAL_DEPLOYS", desc: "Hackathon kickoff, team matchmaking, and system keys distribution." },
        { time: "12:00 PM", title: "CHECKPOINT_ALPHA", desc: "Mentor review of system architectural specs and repository sync." },
        { time: "09:00 PM", title: "NIGHT_SPRINT", desc: "Hacker fuel refill station opening. Midnight coding sprint activation." }
      ],
      day2: [
        { time: "10:00 AM", title: "CHECKPOINT_BETA", desc: "Feature-freeze checking, build stabilization review, and demo alignment." },
        { time: "03:00 PM", title: "COMPILE_DEMOS", desc: "Pitch deck workshops and presentation compilation runs." },
        { time: "06:00 PM", title: "SUBMIT_BUILDS", desc: "Final repository lock, source code compilation, and judging panel starts." }
      ]
    },
    activities: {
      day: [
        "Git Rebase Speedruns (live code optimization challenge)",
        "Co-working peer matching & system setup reviews",
        "Coffee & Energy drinks fuel terminals access"
      ],
      night: [
        "Silent Coding Sprint with Synthwave DJ soundtrack",
        "Midnight pizza & high-caffeine energy bar drops",
        "Retro arcade console highscore challenge battles"
      ]
    }
  }
};

export default function DomainTimeline() {
  const [activeDomain, setActiveDomain] = useState<DomainKey | null>(null);
  const [selectedDay, setSelectedDay] = useState<"day1" | "day2">("day1");
  const [activeHackathonTab, setActiveHackathonTab] = useState<"problems" | "schedule" | "activities">("problems");

  const handleClose = () => {
    setActiveDomain(null);
    setSelectedDay("day1");
  };

  const domainKeys = Object.keys(domainData) as DomainKey[];

  return (
    <div className="w-full relative">
      <AnimatePresence mode="wait">
        {!activeDomain ? (
          // COLLAPSED VIEW: Grid of Domain Cards
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-6 md:grid-cols-4"
          >
            {domainKeys.map((key, index) => {
              const item = domainData[key];
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={key}
                  layoutId={`domain-card-${key}`}
                  onClick={() => setActiveDomain(key)}
                  className={`rounded-md border bg-[#07050d]/85 p-6 hover:bg-[#0f0b1a]/90 transition-all duration-300 relative cursor-pointer flex flex-col justify-between items-start group crt-screen ${item.color} border-opacity-40 hover:border-opacity-100 hover:${item.glowColor}`}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Subtle retro scanline decoration inside each card */}
                  <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity" />

                  <div className="w-full">
                    {/* Index marker */}
                    <div className="absolute top-2 right-4 font-pixel text-4xl opacity-5 group-hover:opacity-15 select-none transition-opacity">
                      0{index + 1}
                    </div>

                    {/* Icon container */}
                    <motion.div 
                      layoutId={`domain-icon-container-${key}`}
                      className={`mb-6 flex h-12 w-12 items-center justify-center border rounded font-pixel ${item.accentBg} ${item.color} border-opacity-30`}
                    >
                      <IconComponent className="h-6 w-6" />
                    </motion.div>

                    <motion.h3 
                      layoutId={`domain-title-${key}`}
                      className="font-display text-xl font-bold text-white tracking-wider mb-3 group-hover:text-neon-cyan transition-colors"
                    >
                      {item.title}
                    </motion.h3>

                    <p className="text-xs leading-relaxed text-muted-foreground uppercase mb-6">
                      {key === "hackathon"
                        ? "48-hour high-octane coding race with custom tracks, problem statements, and schedules."
                        : `Master Day 1 and Day 2 curriculums in our specialized ${item.title} bootcamp module.`}
                    </p>
                  </div>

                  <span className="text-[10px] font-bold tracking-widest text-secondary hover:text-white inline-flex items-center gap-1.5 font-terminal transition-all group-hover:translate-x-1.5">
                    DEPLOY_PORTAL_LOGS <ArrowRight className="h-3 w-3" />
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          // EXPANDED VIEW: Full Details Card for Selected Domain
          <motion.div
            key="expanded"
            layoutId={`domain-card-${activeDomain}`}
            className={`w-full rounded-md border bg-[#07050d]/95 p-4 sm:p-6 md:p-8 relative min-h-[500px] border-opacity-80 crt-screen ${domainData[activeDomain].color} ${domainData[activeDomain].glowColor}`}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded border border-primary/20 bg-[#090812] text-muted-foreground hover:text-white hover:border-primary transition-all duration-200"
              aria-label="Close extended view"
            >
              <X className="h-5 w-5" />
            </button>
 
            {/* Header info */}
            <div className="flex items-center gap-3 sm:gap-4 mb-8 border-b border-primary/10 pb-6 pr-10 sm:pr-0">
              <motion.div 
                layoutId={`domain-icon-container-${activeDomain}`}
                className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center border rounded ${domainData[activeDomain].accentBg} ${domainData[activeDomain].color}`}
              >
                {(() => {
                  const Icon = domainData[activeDomain].icon;
                  return <Icon className="h-6 w-6 sm:h-7 sm:w-7" />;
                })()}
              </motion.div>
 
              <div>
                <motion.h2 
                  layoutId={`domain-title-${activeDomain}`}
                  className="font-display text-lg sm:text-2xl md:text-3xl font-bold text-white tracking-wider sm:tracking-widest uppercase"
                >
                  {domainData[activeDomain].title}
                </motion.h2>
                <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                  SECURE_DOMAIN_ENVIRONMENT // STATE_DESTRUCT_COMPILED
                </p>
              </div>
            </div>
 
            {/* Content Switcher depending on Domain Type */}
            {activeDomain !== "hackathon" ? (
              // NON-HACKATHON DOMAINS (Web, Game, AI/ML)
              <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
                {/* Curriculum & Day navigation */}
                <div className="space-y-6">
                  {/* Day selection tabs */}
                  <div className="flex flex-wrap gap-2">
                    {(["day1", "day2"] as const).map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-3 py-1.5 sm:px-5 sm:py-2 font-bold tracking-wider sm:tracking-widest text-[10px] sm:text-xs uppercase border rounded transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${
                          selectedDay === day
                            ? `bg-primary text-white ${domainData[activeDomain].color}`
                            : "border-primary/20 text-muted-foreground hover:text-white bg-transparent"
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5 hidden xs:inline" />
                        <span>{day === "day1" ? "DAY 01" : "DAY 02"}</span>
                      </button>
                    ))}
                  </div>

                  {/* Day Content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedDay}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="border border-primary/20 bg-[#090812]/80 p-5 rounded space-y-4"
                    >
                      <div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">CURRICULUM_OBJECTIVE</div>
                        <h4 className="text-white font-bold text-lg uppercase tracking-wide">
                          {domainData[activeDomain].days[selectedDay].title}
                        </h4>
                      </div>

                      <p className="text-xs leading-relaxed text-muted-foreground uppercase">
                        {domainData[activeDomain].days[selectedDay].curriculum}
                      </p>

                      <div className="space-y-2.5">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-widest">TOPICS_UNDER_REVIEW</div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {domainData[activeDomain].days[selectedDay].topics.map((topic, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-white border border-primary/10 bg-[#07060c] p-2.5 rounded font-terminal">
                              <span className="font-pixel text-[10px] text-primary/70">0{i+1}</span>
                              <span className="uppercase">{topic}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Mentor section */}
                <div className="border border-secondary/20 bg-[#090812]/60 p-5 rounded flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-secondary/10 pb-3">
                    <User className="h-4 w-4 text-secondary" />
                    <h3 className="font-pixel text-xs text-secondary tracking-widest uppercase">KNOW YOUR MENTOR</h3>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={domainData[activeDomain].mentor.avatar}
                      alt={domainData[activeDomain].mentor.name}
                      className="w-24 h-24 border-2 border-secondary/30 rounded object-cover shadow-cyan bg-[#07060c]"
                    />
                    <div className="text-center sm:text-left">
                      <h4 className="font-display text-lg font-bold text-white tracking-wide uppercase">
                        {domainData[activeDomain].mentor.name}
                      </h4>
                      <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mt-0.5">
                        {domainData[activeDomain].mentor.role}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground uppercase">
                    {domainData[activeDomain].mentor.bio}
                  </p>
                </div>
              </div>
            ) : (
              // EXPANDED HACKATHON DOMAIN
              <div className="space-y-6">
                {/* Hackathon sub-tabs navigation */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "problems", label: "PROBLEM_STATEMENTS", shortLabel: "PROBLEMS", icon: Shield },
                    { id: "schedule", label: "SCHEDULE_CHRONO", shortLabel: "SCHEDULE", icon: Calendar },
                    { id: "activities", label: "DAY_NIGHT_ACTIVITIES", shortLabel: "ACTIVITIES", icon: Flame }
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveHackathonTab(tab.id as any)}
                        className={`px-3 py-1.5 sm:px-5 sm:py-2 font-bold tracking-wider sm:tracking-widest text-[10px] sm:text-xs uppercase border rounded transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${
                          activeHackathonTab === tab.id
                            ? "bg-primary text-white border-neon-pink shadow-pink"
                            : "border-primary/20 text-muted-foreground hover:text-white bg-transparent"
                        }`}
                      >
                        <TabIcon className="h-3.5 w-3.5 hidden xs:inline" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub Tab contents */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeHackathonTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="border border-primary/20 bg-[#090812]/80 p-5 md:p-6 rounded"
                  >
                    {activeHackathonTab === "problems" && (
                      <div className="space-y-5">
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">COMPETITION_TRACKS</div>
                          <h3 className="font-display text-xl font-bold text-white uppercase tracking-wider">HACKATHON_PROBLEMS</h3>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          {domainData.hackathon.problemStatements.map((track, idx) => (
                            <div key={idx} className="border border-primary/20 bg-[#07060c] p-4 rounded flex flex-col justify-between">
                              <div>
                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold border border-primary/30 bg-primary/10 text-primary text-neon-pink uppercase tracking-widest mb-3">
                                  {track.track}
                                </span>
                                <h4 className="text-white font-bold text-sm uppercase tracking-wide mb-2">{track.title}</h4>
                                <p className="text-xs text-muted-foreground uppercase leading-relaxed">{track.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeHackathonTab === "schedule" && (
                      <div className="space-y-5">
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">EVENT_TIMELINE</div>
                          <h3 className="font-display text-xl font-bold text-white uppercase tracking-wider">48_HOUR_LOGISTICAL_PROTOCOL</h3>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          {/* Day 1 Timeline */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <h4 className="font-bold text-white text-xs uppercase tracking-wider">DAY_01_SEQUENCE</h4>
                            </div>
                            <div className="space-y-3">
                              {domainData.hackathon.schedule.day1.map((item, idx) => (
                                <div key={idx} className="flex gap-4 border border-primary/10 bg-[#07060c] p-3 rounded text-xs font-terminal">
                                  <div className="font-bold text-primary font-pixel text-neon-pink min-w-[75px]">{item.time}</div>
                                  <div>
                                    <div className="font-bold text-white uppercase tracking-wide">{item.title}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase mt-0.5 leading-relaxed">{item.desc}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Day 2 Timeline */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-secondary/20 pb-2">
                              <Calendar className="h-4 w-4 text-secondary animate-pulse" />
                              <h4 className="font-bold text-white text-xs uppercase tracking-wider">DAY_02_SEQUENCE</h4>
                            </div>
                            <div className="space-y-3">
                              {domainData.hackathon.schedule.day2.map((item, idx) => (
                                <div key={idx} className="flex gap-4 border border-secondary/10 bg-[#07060c] p-3 rounded text-xs font-terminal">
                                  <div className="font-bold text-secondary font-pixel text-neon-cyan min-w-[75px]">{item.time}</div>
                                  <div>
                                    <div className="font-bold text-white uppercase tracking-wide">{item.title}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase mt-0.5 leading-relaxed">{item.desc}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeHackathonTab === "activities" && (
                      <div className="space-y-5">
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">CAMP_PROTOCOL</div>
                          <h3 className="font-display text-xl font-bold text-white uppercase tracking-wider">FUEL_AND_COMPETITIONS</h3>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          {/* Day activities */}
                          <div className="border border-primary/20 bg-[#07060c] p-5 rounded space-y-4">
                            <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <h4 className="font-bold text-white text-xs uppercase tracking-widest">DAYTIME_STIMULUS</h4>
                            </div>
                            <ul className="space-y-2">
                              {domainData.hackathon.activities.day.map((act, i) => (
                                <li key={i} className="text-xs text-muted-foreground uppercase flex items-start gap-2">
                                  <span className="text-primary font-bold font-pixel text-neon-pink">•</span>
                                  <span>{act}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Night activities */}
                          <div className="border border-secondary/20 bg-[#07060c] p-5 rounded space-y-4">
                            <div className="flex items-center gap-2 border-b border-secondary/10 pb-2">
                              <Flame className="h-4 w-4 text-secondary animate-pulse" />
                              <h4 className="font-bold text-white text-xs uppercase tracking-widest">NIGHT_SURVEILLANCE</h4>
                            </div>
                            <ul className="space-y-2">
                              {domainData.hackathon.activities.night.map((act, i) => (
                                <li key={i} className="text-xs text-muted-foreground uppercase flex items-start gap-2">
                                  <span className="text-secondary font-bold font-pixel text-neon-cyan">•</span>
                                  <span>{act}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
