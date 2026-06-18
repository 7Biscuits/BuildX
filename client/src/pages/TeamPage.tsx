import React from "react";
import { Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { 
  ArrowLeft, 
  Terminal, 
  ShieldAlert, 
  Code, 
  UserRound, 
  Database, 
  Settings, 
  Share2, 
  Cpu, 
  Layers, 
  Network, 
  TrendingUp, 
  Map, 
  Sliders 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import InteractiveBackground from "@/components/InteractiveBackground";
import Navbar from "@/components/Navbar";

// SVG Icons for socials
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

// Type definitions
type SocialLinks = {
  instagram?: string;
  linkedin?: string;
  github?: string;
};

type TeamMember = {
  name: string;
  role: string;
  desc: string;
  avatarType: "executive" | "tech" | "management" | "marketing" | "planning" | "networking";
  socials: SocialLinks;
};

type TeamSection = {
  title: string;
  subCode: string;
  colorClass: string;
  glowClass: string;
  icon: React.ComponentType<any>;
  members: TeamMember[];
};

// Team data organized EXACTLY as requested
const teamSections: TeamSection[] = [
  {
    title: "Executives",
    subCode: "EXEC_COMMAND_UNIT",
    colorClass: "border-neon-pink text-neon-pink shadow-neon-pink/15",
    glowClass: "shadow-pink",
    icon: ShieldAlert,
    members: [
      {
        name: "Samyak",
        role: "Founder & Chief Architect",
        desc: "Oversees core operations, designs decentralized verification pipelines, and coordinates high-level system logistics.",
        avatarType: "executive",
        socials: { instagram: "https://www.instagram.com/py.ssp", linkedin: "https://www.linkedin.com/in/sampy/", github: "https://github.com/Ssp64" }
      },
      {
        name: "Marsad",
        role: "Co-Founder & Producer",
        desc: "Directs tournament scheduling, leads interactive media design, and manages cross-department compiler synchronizations.",
        avatarType: "executive",
        socials: { instagram: "https://www.instagram.com/i.ami_sayeed_080", linkedin: "https://www.linkedin.com/in/marsad-sayeed-bhu/" }
      },
      {
        name: "Risha",
        role: "Executive Director",
        desc: "Coordinates allowlist keys distribution, maintains public relations, and directs executive event policy updates.",
        avatarType: "executive",
        socials: { linkedin: "https://www.linkedin.com" }
      },
      {
        name: "Priya",
        role: "Chief Operations Officer",
        desc: "Maintains administrative systems, audits verification metrics, and ensures operational compliance across all event segments.",
        avatarType: "executive",
        socials: { instagram: "https://instagram.com" }
      }
    ]
  },
  {
    title: "Tech",
    subCode: "SYS_ENGINEERS_DEV",
    colorClass: "border-neon-cyan text-neon-cyan shadow-neon-cyan/15",
    glowClass: "shadow-cyan",
    icon: Code,
    members: [
      {
        name: "Kabir",
        role: "CTO & Systems Lead",
        desc: "Architects Express REST controllers, secures Prisma models, and configures bi-directional Socket.IO WebSockets loops.",
        avatarType: "tech",
        socials: { github: "https://github.com", linkedin: "https://linkedin.com" }
      },
      {
        name: "Riddhima",
        role: "AI Research Scientist",
        desc: "Coordinates clientside deep learning execution models (tf.js) and constructs vector retrieval database (RAG) modules.",
        avatarType: "tech",
        socials: { instagram: "https://instagram.com", github: "https://github.com" }
      }
    ]
  },
  {
    title: "Management",
    subCode: "SYS_LOGISTICS_CNTRL",
    colorClass: "border-neon-violet text-[#a855f7] shadow-neon-violet/15",
    glowClass: "shadow-glow",
    icon: Sliders,
    members: [
      {
        name: "Aarav",
        role: "Operations Manager",
        desc: "Coordinates check-in terminals, logs core statistics, and manages coworking facilities.",
        avatarType: "management",
        socials: { linkedin: "https://linkedin.com" }
      },
      {
        name: "Ananya",
        role: "Verification Officer",
        desc: "Moderates receipt image submissions, audits JWT authorizations, and resolves transaction ticket errors.",
        avatarType: "management",
        socials: { instagram: "https://instagram.com" }
      },
      {
        name: "Vivaan",
        role: "Lobby Lead",
        desc: "Coordinates live host session configurations, countdown tickers, and real-time leaderboards sync.",
        avatarType: "management",
        socials: { github: "https://github.com" }
      }
    ]
  },
  {
    title: "Marketing",
    subCode: "COMMS_GROWTH_NODE",
    colorClass: "border-neon-pink text-neon-pink shadow-neon-pink/15",
    glowClass: "shadow-pink",
    icon: TrendingUp,
    members: [
      {
        name: "Diya",
        role: "Creative Director",
        desc: "Establishes visual styles, color tokens, pixel layout decorations, and landing graphic mockups.",
        avatarType: "marketing",
        socials: { instagram: "https://instagram.com" }
      },
      {
        name: "Rohan",
        role: "Social Growth Lead",
        desc: "Develops digital outreach systems, builds hacker channels, and manages communities.",
        avatarType: "marketing",
        socials: { linkedin: "https://linkedin.com" }
      },
      {
        name: "Ishaan",
        role: "Copywriter & Editor",
        desc: "Composes console alerts, terminal messages, bootcamp descriptions, and curriculum data scripts.",
        avatarType: "marketing",
        socials: { github: "https://github.com" }
      },
      {
        name: "Advika",
        role: "Campus Ambassador Liaison",
        desc: "Establishes developer relations across local colleges, university clubs, and tech centers.",
        avatarType: "marketing",
        socials: { linkedin: "https://linkedin.com" }
      },
      {
        name: "Reyansh",
        role: "Media Producer",
        desc: "Curates video compilations, records session highlights, and logs media assets.",
        avatarType: "marketing",
        socials: { instagram: "https://instagram.com" }
      },
      {
        name: "Meera",
        role: "Community Manager",
        desc: "Moderates active chat rooms, maintains server bots, and hosts retro game breaks.",
        avatarType: "marketing",
        socials: { github: "https://github.com" }
      },
      {
        name: "Arjun",
        role: "Growth Analyst",
        desc: "Analyzes promotional metrics, optimizes registration conversions, and monitors traffic.",
        avatarType: "marketing",
        socials: { linkedin: "https://linkedin.com" }
      },
      {
        name: "Kavya",
        role: "Event Promotions Lead",
        desc: "Coordinates offline marketing materials, banner distributions, and team logistics.",
        avatarType: "marketing",
        socials: { instagram: "https://instagram.com" }
      }
    ]
  },
  {
    title: "Planning",
    subCode: "CHRONO_LOGISTICS_PLAN",
    colorClass: "border-neon-cyan text-neon-cyan shadow-neon-cyan/15",
    glowClass: "shadow-cyan",
    icon: Map,
    members: [
      {
        name: "Sai",
        role: "Lead Timeline Architect",
        desc: "Designs the 48-hour schedule sequence, checkpoint timelines, and judge match-matchings.",
        avatarType: "planning",
        socials: { linkedin: "https://linkedin.com" }
      },
      {
        name: "Zara",
        role: "Resource Planner",
        desc: "Sponsors energy drink terminals, arranges midnight catering drops, and plans hardware supplies.",
        avatarType: "planning",
        socials: { instagram: "https://instagram.com" }
      }
    ]
  },
  {
    title: "Networking",
    subCode: "NET_SYS_OPERATORS",
    colorClass: "border-neon-violet text-[#a855f7] shadow-neon-violet/15",
    glowClass: "shadow-glow",
    icon: Network,
    members: [
      {
        name: "Dev",
        role: "Subnet Administrator",
        desc: "Manages hardware deployments, establishes security, and monitors packet traffic gateways.",
        avatarType: "networking",
        socials: { github: "https://github.com" }
      },
      {
        name: "Kiara",
        role: "Relations Lead",
        desc: "Connects with Titanium sponsor networks, API providers, and controls reward payouts.",
        avatarType: "networking",
        socials: { linkedin: "https://linkedin.com" }
      }
    ]
  }
];

// Custom animated SVG profile photo placeholders based on role types
const TeamAvatar = ({ type }: { type: TeamMember["avatarType"] }) => {
  const gradientId = `avatar-grad-${type}`;
  let color1 = "#ff007f"; // pink
  let color2 = "#31baf5"; // cyan

  if (type === "tech") {
    color1 = "#00f0ff";
    color2 = "#0072ff";
  } else if (type === "management") {
    color1 = "#a855f7";
    color2 = "#ff007f";
  } else if (type === "planning") {
    color1 = "#00f5a0";
    color2 = "#00d9f6";
  } else if (type === "networking") {
    color1 = "#ff7b00";
    color2 = "#ff007f";
  }

  return (
    <div className="relative w-20 h-20 mx-auto rounded border border-white/10 bg-[#07060c] overflow-hidden flex items-center justify-center group-hover:border-primary transition-all duration-300">
      <div className="absolute inset-0 opacity-15 mix-blend-color-dodge bg-scanlines pointer-events-none" />
      <svg className="w-16 h-16 animate-pulse" viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>

        {type === "executive" && (
          <>
            <circle cx="50" cy="50" r="32" stroke={`url(#${gradientId})`} strokeWidth="1.5" strokeDasharray="3 3" />
            <rect x="35" y="35" width="30" height="30" rx="3" stroke={`url(#${gradientId})`} strokeWidth="2" />
            <circle cx="50" cy="50" r="4" fill={`url(#${gradientId})`} />
          </>
        )}
        {type === "tech" && (
          <>
            <path d="M25 50L40 35M25 50L40 65M75 50L60 35M75 50L60 65" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="55" y1="30" x2="45" y2="70" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {type === "management" && (
          <>
            <rect x="30" y="25" width="40" height="50" rx="2" stroke={`url(#${gradientId})`} strokeWidth="1.5" />
            <line x1="38" y1="40" x2="62" y2="40" stroke={`url(#${gradientId})`} strokeWidth="2" />
            <line x1="38" y1="50" x2="55" y2="50" stroke={`url(#${gradientId})`} strokeWidth="2" />
            <line x1="38" y1="60" x2="62" y2="60" stroke={`url(#${gradientId})`} strokeWidth="2" />
          </>
        )}
        {type === "marketing" && (
          <>
            <polygon points="50,25 75,70 25,70" stroke={`url(#${gradientId})`} strokeWidth="1.5" />
            <circle cx="50" cy="53" r="10" stroke={`url(#${gradientId})`} strokeWidth="2" />
          </>
        )}
        {type === "planning" && (
          <>
            <rect x="25" y="30" width="50" height="40" rx="4" stroke={`url(#${gradientId})`} strokeWidth="1.5" />
            <circle cx="40" cy="50" r="5" stroke={`url(#${gradientId})`} strokeWidth="2" />
            <circle cx="60" cy="50" r="5" stroke={`url(#${gradientId})`} strokeWidth="2" />
            <line x1="45" y1="50" x2="55" y2="50" stroke={`url(#${gradientId})`} strokeWidth="1.5" />
          </>
        )}
        {type === "networking" && (
          <>
            <circle cx="50" cy="35" r="8" stroke={`url(#${gradientId})`} strokeWidth="1.5" />
            <circle cx="35" cy="65" r="8" stroke={`url(#${gradientId})`} strokeWidth="1.5" />
            <circle cx="65" cy="65" r="8" stroke={`url(#${gradientId})`} strokeWidth="1.5" />
            <line x1="45" y1="42" x2="38" y2="58" stroke={`url(#${gradientId})`} strokeWidth="1.5" />
            <line x1="55" y1="42" x2="62" y2="58" stroke={`url(#${gradientId})`} strokeWidth="1.5" />
          </>
        )}
      </svg>
    </div>
  );
};

// Animation settings
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function TeamPage() {
  return (
    <div className="min-h-screen text-white font-terminal selection:bg-primary selection:text-white">
      <InteractiveBackground />
      <Navbar />

      <main className="container py-12 relative z-10 max-w-6xl space-y-12">
        {/* Back Button */}
        <div className="flex">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-white font-bold gap-1 font-terminal">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              ABORT_TO_HOME
            </Link>
          </Button>
        </div>

        {/* Header Title Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2 bg-[#07050d]/85 border border-primary/20 p-5 sm:p-6 rounded crt-screen shadow-neon-pink/5"
        >
          <p className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary text-neon-pink w-fit">
            <Terminal className="h-3.5 w-3.5 animate-pulse" />
            BUILDX_STAFF_ROSTER
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-widest text-white uppercase font-display">
            MEET THE BUILDX TEAM
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase">
            DIRECTORY LOGS OF ORGANIZERS, ENGINEERS, AND OPERATIONS PLANNERS
          </p>
        </motion.div>

        {/* Team Sections mapping */}
        {teamSections.map((section) => {
          const SectionIcon = section.icon;

          return (
            <div key={section.title} className="space-y-6">
              {/* Category Header */}
              <div className="flex items-center gap-2 border-b border-primary/20 pb-2.5">
                <SectionIcon className={`h-5 w-5 ${section.title === "Tech" || section.title === "Planning" ? "text-secondary text-neon-cyan" : "text-primary text-neon-pink"}`} />
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-lg font-bold text-white tracking-widest uppercase">{section.title}</h2>
                  <span className="text-[9px] text-muted-foreground uppercase font-terminal">({section.subCode})</span>
                </div>
              </div>

              {/* Responsive Grid mapping */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
              >
                {section.members.map((member) => (
                  <motion.div 
                    key={member.name}
                    variants={cardVariants}
                    className="group"
                  >
                    <Card className="flex flex-col h-full bg-[#07050d]/90 border border-primary/20 rounded font-terminal transition-all duration-300 hover:border-primary hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#ff007f] crt-screen">
                      <CardHeader className="bg-[#0e0c1b]/60 p-4 border-b border-primary/10">
                        {/* Avatar */}
                        <div className="mb-4">
                          <TeamAvatar type={member.avatarType} />
                        </div>
                        <div className="text-center">
                          <CardTitle className="text-white text-base font-bold tracking-wider uppercase">
                            {member.name}
                          </CardTitle>
                          <CardDescription className="text-[9px] text-secondary font-bold uppercase tracking-wider text-neon-cyan mt-1">
                            {member.role}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 flex flex-col flex-grow justify-between gap-4 text-xs">
                        <p className="text-slate-400 leading-relaxed uppercase text-[10px]">
                          {member.desc}
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-2 pt-2 border-t border-white/5">
                          {member.socials.instagram && (
                            <a 
                              href={member.socials.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 grid h-8 place-items-center bg-[#0e0920] border border-primary/20 hover:border-primary hover:text-primary hover:shadow-neon-pink rounded text-muted-foreground transition duration-200"
                              title="Instagram"
                            >
                              <InstagramIcon />
                            </a>
                          )}
                          {member.socials.linkedin && (
                            <a 
                              href={member.socials.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 grid h-8 place-items-center bg-[#0c0a1a] border border-[#31baf5]/20 hover:border-[#31baf5] hover:text-[#31baf5] hover:shadow-neon-cyan rounded text-muted-foreground transition duration-200"
                              title="LinkedIn"
                            >
                              <LinkedinIcon />
                            </a>
                          )}
                          {member.socials.github && (
                            <a 
                              href={member.socials.github} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 grid h-8 place-items-center bg-[#07050d] border border-muted/30 hover:border-white hover:text-white rounded text-muted-foreground transition duration-200"
                              title="GitHub"
                            >
                              <GithubIcon />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
