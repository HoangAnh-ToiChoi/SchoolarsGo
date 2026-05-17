const AuroraBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050510]">
    <div
      className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-purple-600/30 blur-[120px] animate-pulse"
      style={{ animationDuration: '4s' }}
    />
    <div
      className="absolute left-1/3 top-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/25 blur-[100px] animate-pulse"
      style={{ animationDuration: '5s', animationDelay: '1s' }}
    />
    <div
      className="absolute -right-1/4 top-1/3 h-[550px] w-[550px] rounded-full bg-cyan-500/20 blur-[110px] animate-pulse"
      style={{ animationDuration: '6s', animationDelay: '2s' }}
    />
    <div
      className="absolute -bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-pink-500/15 blur-[100px] animate-pulse"
      style={{ animationDuration: '5s', animationDelay: '0.5s' }}
    />
    <div
      className="absolute -bottom-1/3 right-1/4 h-[450px] w-[450px] rounded-full bg-cyan-400/15 blur-[120px] animate-pulse"
      style={{ animationDuration: '4s', animationDelay: '1.5s' }}
    />
  </div>
);

export default AuroraBackground;
