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
      bio: "Samyak's writeup Lorem ipsum dolor sit amet consectetur adipisicing elit. Sunt mollitia fuga iusto dolor inventore, totam rem officiis natus  laborum expedita culpa fugit odio officia dicta ullam, ut deserunt doloribus itaque? "
    },
    days: {
      day1: {
        title: "Day 1 of web dev",
        curriculum: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. Totam facilis eum dolore id. Consectetur, incidunt, nobis accusamus ea nulla provident recusandae velit cupiditate omnis optio  velit cupiditate omnis optio perspiciatis corrupti repudiandae...",
        topics: [
          "topic 1",
          "topic 2",
          "topic 3",
          "topic 4"
        ]
      },
      day2: {
        title: "Day 2 of web dev",
        curriculum: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. Totam facilis eum dolore id. Consectetur, incidunt, nobis accusamus ea nulla provident recusandae velit cupiditate omnis optio  velit cupiditate omnis optio perspiciatis corrupti repudiandae...",
        topics: [
          "topic 1",
          "topic 2",
          "topic 3",
          "topic 4"
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
      bio: "Marsad's writeup Lorem ipsum dolor sit amet consectetur adipisicing elit. Sunt mollitia fuga iusto dolor inventore, totam rem officiis natus  laborum expedita culpa fugit odio officia dicta ullam, ut deserunt doloribus itaque? "
    },
    days: {
      day1: {
        title: "Day 1 of game dev",
        curriculum: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. Totam facilis eum dolore id. Consectetur, incidunt, nobis accusamus ea nulla provident recusandae velit cupiditate omnis optio  velit cupiditate omnis optio...",
        topics: [
          "topic 1",
          "topic 2",
          "topic 3",
          "topic 4"
        ]
      },
      day2: {
        title: "Day 2 of game dev",
        curriculum: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. Totam facilis eum dolore id. Consectetur, incidunt, nobis accusamus ea nulla provident recusandae velit cupiditate omnis optio  velit cupiditate omnis optio...",
        topics: [
          "topic 1",
          "topic 2",
          "topic 3",
          "topic 4"
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
      bio: "Riddhima's writeup Lorem ipsum dolor sit amet consectetur adipisicing elit. Sunt mollitia fuga iusto dolor inventore, totam rem officiis natus  laborum expedita culpa fugit odio officia dicta ullam, ut deserunt doloribus itaque? "
    },
    days: {
      day1: {
        title: "Day 1 of AI / ML",
        curriculum: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. Totam facilis eum dolore id. Consectetur, incidunt, nobis accusamus ea nulla provident recusandae velit cupiditate omnis optio  velit cupiditate omnis optio...",
        topics: [
          "topic 1",
          "topic 2",
          "topic 3",
          "topic 4"
        ]
      },
      day2: {
        title: "Day 2 of AI / ML",
        curriculum: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. Totam facilis eum dolore id. Consectetur, incidunt, nobis accusamus ea nulla provident recusandae velit cupiditate omnis optio  velit cupiditate omnis optio...",
        topics: [
          "topic 1",
          "topic 2",
          "topic 3",
          "topic 4"
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
        title: "Problem statement 1",
        desc: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. Totam facilis eum dolore id. Consectetur, incidunt, nobis accusamus ea nulla provident recusandae velit cupiditate omnis optio  velit cupiditate omnis optio... "
      },
      {
        track: "Game Development Track",
        title: "Problem statement 2",
        desc: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. Totam facilis eum dolore id. Consectetur, incidunt, nobis accusamus ea nulla provident recusandae velit cupiditate omnis optio  velit cupiditate omnis optio... "
      },
      {
        track: "AI / ML Track",
        title: "Problem statement 3",
        desc: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. Totam facilis eum dolore id. Consectetur, incidunt, nobis accusamus ea nulla provident recusandae velit cupiditate omnis optio  velit cupiditate omnis optio... "
      }
    ],
    schedule: {
      day1: [
        { time: "09:00 AM", title: "SCHED_EVENT_1", desc: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. " },
        { time: "12:00 PM", title: "SCHED_EVENT_2", desc: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. " },
        { time: "09:00 PM", title: "SCHED_EVENT_3", desc: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. " }
      ],
      day2: [
        { time: "10:00 AM", title: "SCHED_EVENT_4", desc: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. " },
        { time: "03:00 PM", title: "SCHED_EVENT_5", desc: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. " },
        { time: "06:00 PM", title: "SCHED_EVENT_6", desc: " Lorem ipsum, dolor sit amet consectetur adipisicing elit. " }
      ]
    },
    activities: {
      day: [
        "activity 1",
        "activity 2",
        "activity 3"
      ],
      night: [
        "activity 4",
        "activity 5",
        "activity 6"
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
                    View <ArrowRight className="h-3 w-3" />
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
            className={`w-full rounded-md border bg-[#07050d]/95 p-6 md:p-8 relative min-h-[500px] border-opacity-80 crt-screen ${domainData[activeDomain].color} ${domainData[activeDomain].glowColor}`}
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
            <div className="flex items-center gap-4 mb-8 border-b border-primary/10 pb-6">
              <motion.div 
                layoutId={`domain-icon-container-${activeDomain}`}
                className={`flex h-14 w-14 items-center justify-center border rounded ${domainData[activeDomain].accentBg} ${domainData[activeDomain].color}`}
              >
                {(() => {
                  const Icon = domainData[activeDomain].icon;
                  return <Icon className="h-7 w-7" />;
                })()}
              </motion.div>

              <div>
                <motion.h2 
                  layoutId={`domain-title-${activeDomain}`}
                  className="font-display text-3xl font-bold text-white tracking-widest uppercase"
                >
                  {domainData[activeDomain].title}
                </motion.h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
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
                  <div className="flex gap-3">
                    {(["day1", "day2"] as const).map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-5 py-2 font-bold tracking-widest text-xs uppercase border rounded transition-all duration-200 flex items-center gap-2 ${
                          selectedDay === day
                            ? `bg-primary text-white ${domainData[activeDomain].color}`
                            : "border-primary/20 text-muted-foreground hover:text-white bg-transparent"
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {day === "day1" ? "DAY_01_SPECS" : "DAY_02_SPECS"}
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
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { id: "problems", label: "PROBLEM_STATEMENTS", icon: Shield },
                    { id: "schedule", label: "SCHEDULE_CHRONO", icon: Calendar },
                    { id: "activities", label: "DAY_NIGHT_ACTIVITIES", icon: Flame }
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveHackathonTab(tab.id as any)}
                        className={`px-5 py-2 font-bold tracking-widest text-xs uppercase border rounded transition-all duration-200 flex items-center gap-2 ${
                          activeHackathonTab === tab.id
                            ? "bg-primary text-white border-neon-pink shadow-pink"
                            : "border-primary/20 text-muted-foreground hover:text-white bg-transparent"
                        }`}
                      >
                        <TabIcon className="h-3.5 w-3.5" />
                        {tab.label}
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
