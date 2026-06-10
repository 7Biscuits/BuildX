import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Users, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import InteractiveBackground from "@/components/InteractiveBackground";
import Navbar from "@/components/Navbar";

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

type SocialLinks = {
  instagram?: string;
  linkedin?: string;
  github?: string;
};

type Organizer = {
  name: string;
  role: string;
  phone: string;
  socials?: SocialLinks;
};

const coreTeam: Organizer[] = [
  {
    name: "Samyak",
    role: "Founder",
    phone: "7376429353",
    socials: {
      instagram: "https://www.instagram.com/py.ssp",
      linkedin: "https://www.linkedin.com/in/sampy/",
      github: "https://github.com/Ssp64"
    }
  },
  {
    name: "Marsad",
    role: "Coordinator",
    phone: "7238941901",
    socials: {
      instagram: "https://www.instagram.com/i.ami_sayeed_080",
      linkedin: "https://www.linkedin.com/in/marsad-sayeed-bhu/"
    }
  }
];

const managementTeam: Organizer[] = [
  { name: "Riddhima", role: "Management Team", phone: "9520924488" },
  { name: "Risha", role: "Management Team", phone: "8090055830" },
  { name: "Priya", role: "Management Team", phone: "9236861954" },
  { name: "Rajneesh", role: "Management Team", phone: "7307546488" }
];

export default function ContactsPage() {
  return (
    <div className="min-h-screen text-white font-terminal selection:bg-primary selection:text-white">
      <InteractiveBackground />
      <Navbar />

      <main className="container py-12 relative z-10 max-w-4xl space-y-8">
        
        {/* Back Button */}
        <div className="flex">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-white font-bold gap-1 font-terminal">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              ABORT_TO_HOME
            </Link>
          </Button>
        </div>

        {/* Page Title Header */}
        <div className="flex flex-col gap-2 bg-[#07050d]/85 border border-primary/20 p-6 rounded crt-screen shadow-neon-pink/5">
          <p className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary text-neon-pink w-fit">
            <Terminal className="h-3.5 w-3.5 animate-pulse" />
            ORGANIZER_DIRECTORY
          </p>
          <h1 className="text-3xl font-bold tracking-widest text-white uppercase font-display">
            COMMS_NODE_DIRECTORY
          </h1>
          <p className="text-xs text-muted-foreground uppercase">
            CONTACT DATA HOOKS FOR THE BUILDX DEVELOPMENT AND MANAGEMENT STAFF
          </p>
        </div>

        {/* Core Organizers Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-secondary/20 pb-2">
            <Users className="h-5 w-5 text-secondary text-neon-cyan" />
            <h2 className="text-lg font-bold text-white tracking-widest uppercase">CORE_COMMANDERS</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {coreTeam.map((member) => (
              <Card key={member.name} className="bg-[#07050d]/90 border border-secondary/30 rounded font-terminal crt-screen hover:border-secondary hover:shadow-cyan transition-all duration-300">
                <CardHeader className="border-b border-secondary/10 bg-[#0e1d24]/50 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg font-bold tracking-widest uppercase">{member.name}</CardTitle>
                      <CardDescription className="text-[10px] text-secondary font-bold uppercase tracking-wider text-neon-cyan mt-0.5">
                        {member.role}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Whatsapp link */}
                  <a 
                    href={`https://wa.me/${member.phone}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#0c0a1a] border border-secondary/20 hover:border-secondary p-2.5 rounded text-white font-bold transition uppercase"
                  >
                    <Phone className="h-4 w-4 text-secondary text-neon-cyan" />
                    <span>WHATSAPP: {member.phone}</span>
                  </a>

                  {/* Social Buttons */}
                  {member.socials && (
                    <div className="flex gap-2 pt-1">
                      {member.socials.instagram && (
                        <a 
                          href={member.socials.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 grid h-9 place-items-center bg-[#0e0920] border border-primary/20 hover:border-primary hover:text-primary hover:shadow-neon-pink rounded text-muted-foreground transition duration-200"
                          title="Instagram Link"
                        >
                          <InstagramIcon />
                        </a>
                      )}
                      {member.socials.linkedin && (
                        <a 
                          href={member.socials.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 grid h-9 place-items-center bg-[#0c0a1a] border border-[#31baf5]/20 hover:border-[#31baf5] hover:text-[#31baf5] hover:shadow-neon-cyan rounded text-muted-foreground transition duration-200"
                          title="LinkedIn Link"
                        >
                          <LinkedinIcon />
                        </a>
                      )}
                      {member.socials.github && (
                        <a 
                          href={member.socials.github} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 grid h-9 place-items-center bg-[#07050d] border border-muted/30 hover:border-white hover:text-white rounded text-muted-foreground transition duration-200"
                          title="GitHub Link"
                        >
                          <GithubIcon />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Management Staff Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
            <Users className="h-5 w-5 text-primary text-neon-pink" />
            <h2 className="text-lg font-bold text-white tracking-widest uppercase">MANAGEMENT_STAFF</h2>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {managementTeam.map((member) => (
              <Card key={member.name} className="bg-[#07050d]/90 border border-primary/20 rounded font-terminal hover:border-primary hover:shadow-pink transition-all duration-300">
                <CardHeader className="bg-[#0f0e20]/40 p-3.5 border-b border-primary/10">
                  <CardTitle className="text-white text-sm font-bold tracking-widest uppercase">{member.name}</CardTitle>
                  <CardDescription className="text-[9px] text-primary font-bold uppercase tracking-wider text-neon-pink mt-0.5">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3">
                  <a 
                    href={`tel:${member.phone}`}
                    className="flex items-center justify-center gap-1.5 bg-[#090812] border border-primary/10 hover:border-primary p-2 rounded text-[10px] text-white font-bold transition uppercase"
                  >
                    <Phone className="h-3 w-3 text-primary text-neon-pink" />
                    <span>CALL: {member.phone}</span>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
