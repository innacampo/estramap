import { motion } from "framer-motion";
import { MapPin, Search, Share2, ThumbsUp, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Search,
    title: "Find",
    description: "Search by location or browse community reports near you.",
    gradient: "from-primary to-primary/60",
  },
  {
    icon: Share2,
    title: "Report",
    description: "Found stock? Share the pharmacy name, dose, and status.",
    gradient: "from-accent to-accent/60",
  },
  {
    icon: ThumbsUp,
    title: "Verify",
    description: "Upvote accurate reports so others can trust what they see.",
    gradient: "from-in-stock to-in-stock/60",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

interface HeroOnboardingProps {
  onOpenReport: () => void;
}

const HeroOnboarding = ({ onOpenReport }: HeroOnboardingProps) => {
  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card via-card to-muted/30 shadow-premium-lg mb-6"
    >
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/[0.02] blur-3xl" />
      </div>

      <div className="relative px-6 py-10 sm:px-10 sm:py-14">
        {/* Badge */}
        <motion.div variants={fadeUp} className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary tracking-wide uppercase border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Community-Powered
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div variants={fadeUp} className="text-center max-w-xl mx-auto mb-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
            Track{" "}
            <span className="gradient-text">Estradiol Patch</span>{" "}
            Availability in Real Time
          </h2>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="text-center text-muted-foreground text-sm sm:text-base max-w-md mx-auto mb-10 leading-relaxed"
        >
          A free, crowd-sourced tracker helping people find estradiol patches during shortages. No account needed.
        </motion.p>

        {/* How it works steps */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-2xl mx-auto mb-10"
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative flex flex-col items-center text-center rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-5 sm:p-6 shadow-sm hover:shadow-premium hover:border-primary/30 transition-all duration-300"
            >
              {/* Step number */}
              <span className="absolute -top-2.5 -left-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground border border-border/50 shadow-sm">
                {i + 1}
              </span>

              <div className={`mb-3 rounded-xl bg-gradient-to-br ${step.gradient} p-3 shadow-premium group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className="h-5 w-5 text-primary-foreground" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-bold mb-1 text-foreground">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={onOpenReport}
            size="lg"
            className="gap-2 h-12 px-8 rounded-xl font-semibold shadow-premium glow-primary transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
          >
            <Sparkles className="h-4 w-4" />
            Submit Your First Report
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <p className="text-xs text-muted-foreground">
            <MapPin className="inline h-3 w-3 mr-1 -mt-0.5" />
            Anonymous · No sign-up required
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HeroOnboarding;
