import React, { useEffect, useRef } from "react";

export const Home: React.FC<{
  onNavigate: (view: string) => void;
}> = ({ onNavigate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(168, 85, 247, 0.5)";

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLearnMore = () => {
    const aboutSection = document.getElementById("about-section");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const features = [
    {
      icon: "✓",
      title: "Task Management",
      desc: "Organize, prioritize, and complete tasks with ease",
    },
    {
      icon: "⟳",
      title: "Smart Routines",
      desc: "Build powerful habits with customizable routines",
    },
    {
      icon: "📊",
      title: "Habit Tracking",
      desc: "Track your progress and build lasting streaks",
    },
    {
      icon: "✍️",
      title: "Journal & Notes",
      desc: "Capture thoughts and ideas in one place",
    },
    {
      icon: "⏱️",
      title: "Focus Sessions",
      desc: "Deep work timer with Pomodoro technique",
    },
    {
      icon: "📅",
      title: "Calendar View",
      desc: "Visualize your schedule and plan ahead",
    },
  ];

  return (
    <div className="w-full min-h-screen overflow-y-auto bg-black text-white font-sans relative">
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 opacity-30"
      ></canvas>

      {/* Retro Grid Overlay */}
      <div
        className="fixed inset-0 -z-10 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      ></div>

      {/* Gradient Overlay */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative">
        {/* Floating Glow Effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>

        <div className="relative z-10">
          {/* Logo/Badge */}
          <div className="inline-block mb-6 px-6 py-2 rounded-full border border-purple-500/50 bg-purple-500/10 backdrop-blur-sm">
            <span className="text-purple-300 text-sm font-semibold tracking-wider">
              PRODUCTIVITY OS
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl animate-gradient">
            CoreBlock
          </h1>

          <p className="text-xl md:text-2xl max-w-3xl text-gray-300 leading-relaxed mb-12 font-light">
            Your all-in-one workspace for{" "}
            <span className="text-purple-400 font-semibold">tasks</span>,{" "}
            <span className="text-pink-400 font-semibold">routines</span>,{" "}
            <span className="text-purple-400 font-semibold">habits</span>, and{" "}
            <span className="text-pink-400 font-semibold">focus</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <button
              onClick={() => onNavigate("dashboard")}
              className="group relative px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 
                         text-white font-bold text-lg hover:scale-105 transition-all duration-300 shadow-2xl
                         shadow-purple-500/50 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Try Demo
                <span className="group-hover:translate-x-1 transition-transform">
                  🚀
                </span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            <button
              onClick={handleLearnMore}
              className="px-10 py-4 rounded-2xl border-2 border-purple-500/50 text-gray-200 
                         hover:bg-purple-500/10 hover:border-purple-400 transition-all duration-300
                         backdrop-blur-sm font-semibold text-lg"
            >
              Learn More ↓
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">10+</div>
              <div className="text-gray-400">Features</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400">∞</div>
              <div className="text-gray-400">Possibilities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">100%</div>
              <div className="text-gray-400">Free</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 animate-bounce">
          <div className="w-6 h-10 border-2 border-purple-500/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-purple-400 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="min-h-screen py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">
              Everything you need to master your productivity in one beautiful
              dashboard
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group p-8 rounded-2xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 
                           border border-purple-500/20 hover:border-purple-500/50 backdrop-blur-sm
                           hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-purple-300">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about-section"
        className="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center relative"
      >
        <div className="max-w-5xl">
          <div className="inline-block mb-6 px-6 py-2 rounded-full border border-pink-500/50 bg-pink-500/10 backdrop-blur-sm">
            <span className="text-pink-300 text-sm font-semibold tracking-wider">
              ABOUT US
            </span>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            What is CoreBlock?
          </h2>

          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-12 max-w-3xl mx-auto">
            CoreBlock is a next-generation productivity operating system built
            for <span className="text-purple-400 font-semibold">students</span>
            , <span className="text-pink-400 font-semibold">creators</span>,{" "}
            <span className="text-purple-400 font-semibold">entrepreneurs</span>
            , and anyone who wants to master their workflow.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12 text-left">
            <div className="p-6 rounded-xl bg-purple-900/20 border border-purple-500/20 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-4 text-purple-300">
                Our Mission
              </h3>
              <p className="text-gray-400 leading-relaxed">
                To provide a unified workspace that eliminates context switching
                and helps you focus on what truly matters. No more juggling
                multiple apps—everything you need is here.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-pink-900/20 border border-pink-500/20 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-4 text-pink-300">
                Why CoreBlock?
              </h3>
              <p className="text-gray-400 leading-relaxed">
                We believe productivity tools should be beautiful, intuitive,
                and powerful. CoreBlock combines the best features from various
                tools into one seamless experience.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-3xl font-bold mb-6 text-purple-300">
              Everything In One Place
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Tasks",
                "Routines",
                "Habits",
                "Journal",
                "Notes",
                "Calendar",
                "Focus Timer",
                "Projects",
                "Brain Dump",
                "Analytics",
              ].map((item, idx) => (
                <span
                  key={idx}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 
                             border border-purple-500/30 text-gray-300 font-medium backdrop-blur-sm
                             hover:border-purple-500 transition-all cursor-default"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate("dashboard")}
            className="group relative px-12 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 
                       text-white font-bold text-xl hover:scale-105 transition-all duration-300 shadow-2xl
                       shadow-purple-500/50 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Using CoreBlock
              <span className="group-hover:translate-x-2 transition-transform">
                →
              </span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-purple-500/20 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            CoreBlock
          </div>
          <p className="text-gray-500 mb-6">
            Your productivity operating system
          </p>
          <a
            href="https://coreblock.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            coreblock.in
          </a>
          <p className="text-gray-600 text-sm mt-6">
            © 2024 CoreBlock. Built with passion for productivity.
          </p>
        </div>
      </footer>

    </div>
  );
};