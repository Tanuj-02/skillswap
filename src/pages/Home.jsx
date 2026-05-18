import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Zap, CheckCircle2, Repeat } from "lucide-react";

export default function Home() {
  return (
    <div className="py-4 z-10 text-foreground relative overflow-hidden font-sans">
      
      {/* ── Background Grid & Glowing Orbs ── */}
      {/* Fixed: Increased grid visibility slightly for dark mode */}
      {/* <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none z-0" /> */}
      {/* <div className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(123,108,255,0.1)_0%,transparent_70%)] pointer-events-none z-0" /> */}
      {/* <div className="absolute bottom-[20%] left-[-100px] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,229,176,0.08)_0%,transparent_70%)] pointer-events-none z-0" /> */}

      <section className="relative z-10 max-w-[1240px] mx-auto px-6 pt-32 pb-24 text-center">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-20 left-[10%] hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-[9px] border-[0.5px] border-[var(--teach-border)] bg-[var(--teach-bg)] text-[var(--teach-text)] text-xs font-semibold shadow-lg rotate-[-6deg] backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span> Wants to Learn: React
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="absolute top-32 right-[10%] hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-[9px] border-[0.5px] border-[var(--learn-border)] bg-[var(--learn-bg)] text-[var(--learn-text)] text-xs font-semibold shadow-lg rotate-[4deg] backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span> Can Teach: UI Design
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-[clamp(40px,7vw,72px)] font-heading font-extrabold leading-[1.05] tracking-[-2px] max-w-4xl mx-auto drop-shadow-sm"
        >
          Learn what you need. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--primary)]">
            Teach what you know.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto font-light tracking-[0.01em]"
        >
          Connect with peers, exchange skills, and build your network. SkillSwap matches you with students where your skill gaps perfectly align for mutual growth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-10 flex justify-center gap-4 flex-wrap"
        >
          <Link to="/register">
            <Button size="lg" className="h-14 px-8 text-base font-semibold bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-xl shadow-[0_4px_24px_rgba(123,108,255,0.4)] transition-all hover:-translate-y-0.5 group">
              Find Your Match
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          <Link to="/login">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold rounded-xl border-border bg-card/50 backdrop-blur-sm hover:border-border/80 hover:bg-card">
              Log In
            </Button>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 inline-flex items-center gap-8 py-5 px-10 rounded-2xl bg-card/80 dark:bg-card/40 backdrop-blur-[16px] border-[0.5px] border-border/80 shadow-lg"
        >
          <div className="flex flex-col items-center">
            <span className="font-heading font-black text-2xl text-foreground">1,400+</span>
            <span className="text-xs text-muted-foreground uppercase tracking-[0.8px] font-semibold mt-1">Peers Online</span>
          </div>
          <div className="w-[1px] h-12 bg-border/80"></div>
          <div className="flex flex-col items-center">
            <span className="font-heading font-black text-2xl text-foreground">8,500+</span>
            <span className="text-xs text-muted-foreground uppercase tracking-[0.8px] font-semibold mt-1">Connections</span>
          </div>
          <div className="w-[1px] h-12 bg-border/80 hidden sm:block"></div>
          <div className="flex-col items-center hidden sm:flex">
            <span className="font-heading font-black text-2xl text-foreground">4.9/5</span>
            <span className="text-xs text-muted-foreground uppercase tracking-[0.8px] font-semibold mt-1">Session Rating</span>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 max-w-[1240px] mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-[clamp(32px,4vw,44px)] font-heading font-extrabold tracking-[-1px]">
            More than just <em className="not-italic text-[var(--accent)]">tutoring.</em>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto font-light">
            Build lasting connections with peers who are just as eager to learn as you are.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-[18px]">
          {[
            {
              icon: <Repeat className="h-6 w-6 text-[var(--accent)]" />,
              title: "Two-Way Skill Exchange",
              desc: "It's a give and take. You teach them something they need, and they teach you something you need. No money involved."
            },
            {
              icon: <Users className="h-6 w-6 text-[var(--primary)]" />,
              title: "Build Your Network",
              desc: "Connect with ambitious students from different backgrounds. Your next learning partner could become your future co-founder."
            },
            {
              icon: <Zap className="h-6 w-6 text-[#ff6b9d]" />,
              title: "Learn by Doing",
              desc: "Jump into live 1-on-1 video sessions. Share your screen, collaborate on projects, and master skills together in real-time."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="p-8 rounded-[20px] bg-card/60 backdrop-blur-[12px] border-[0.5px] border-border hover:border-[var(--accent)]/40 hover:bg-card/90 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] group"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6 border-[0.5px] border-border group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="font-heading font-bold text-xl mb-3 tracking-[-0.5px]">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 py-24 bg-muted/30 border-y border-border">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            
            <div className="md:w-1/3">
              <h2 className="text-[clamp(32px,4vw,44px)] font-heading font-extrabold tracking-[-1px] leading-[1.1] mb-4">
                How the swap works.
              </h2>
              <p className="text-muted-foreground mb-8 font-light">
                It takes less than two minutes to set up your profile and find your first perfect match.
              </p>
              <Link to="/register">
                <Button className="rounded-xl h-12 px-6 font-semibold border-[0.5px] border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-none">
                  Create your free profile
                </Button>
              </Link>
            </div>

            <div className="md:w-2/3 grid sm:grid-cols-2 gap-[18px]">
              {[
                { step: "01", title: "Build your stack", desc: "List the skills you can confidently teach, and the ones you desperately want to learn." },
                { step: "02", title: "Find peer matches", desc: "Browse a personalized feed of peers whose skill gaps perfectly align with yours." },
                { step: "03", title: "Connect & Request", desc: "Send a connection request and propose a time for your first 30-minute skill-swap." },
                { step: "04", title: "Grow Together", desc: "Jump on a call, share screens, and build long-lasting professional relationships." }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-[18px] bg-card/90 dark:bg-card/50 backdrop-blur-sm border-[0.5px] border-border relative overflow-hidden transition-all hover:border-[var(--accent)]/40">
                  {/* Fixed: Increased opacity for step numbers in dark mode for better visibility */}
                  <div className="font-heading text-6xl font-extrabold text-foreground/10 dark:text-foreground/20 absolute top-2 right-4 pointer-events-none transition-colors">
                    {item.step}
                  </div>
                  <div className="relative z-10">
                    <CheckCircle2 className="h-6 w-6 text-[var(--primary)] mb-4" />
                    <h3 className="font-heading font-bold text-lg mb-2 tracking-[-0.3px] text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-[1000px] mx-auto px-6 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="p-12 md:p-16 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--accent)]/20 shadow-[0_12px_40px_rgba(123,108,255,0.15)] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-[clamp(32px,4vw,44px)] font-heading font-extrabold tracking-[-1px] mb-4 text-foreground">
              Ready to meet your peers?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg font-light">
              Join the growing community of students connecting, collaborating, and mastering skills together.
            </p>
            <Link to="/register">
              <Button size="lg" className="h-14 px-10 text-base font-bold bg-foreground text-background hover:bg-foreground/90 rounded-xl shadow-xl transition-transform hover:-translate-y-1">
                Join SkillSwap — It's Free
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}