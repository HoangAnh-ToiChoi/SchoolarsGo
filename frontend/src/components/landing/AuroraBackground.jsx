export function AuroraBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-[#050510]">
      {/* Primary purple glow - top left */}
      <div
        className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-purple-600/30 blur-[120px] animate-pulse"
        style={{ animationDuration: "4s" }}
      />

      {/* Indigo glow - center */}
      <div
        className="absolute left-1/3 top-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/25 blur-[100px] animate-pulse"
        style={{ animationDuration: "5s", animationDelay: "1s" }}
      />

      {/* Cyan glow - right */}
      <div
        className="absolute -right-1/4 top-1/3 h-[550px] w-[550px] rounded-full bg-cyan-500/20 blur-[110px] animate-pulse"
        style={{ animationDuration: "6s", animationDelay: "2s" }}
      />

      {/* Pink accent glow - bottom left */}
      <div
        className="absolute -bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-pink-500/15 blur-[100px] animate-pulse"
        style={{ animationDuration: "5s", animationDelay: "0.5s" }}
      />

      {/* Additional cyan glow - bottom right */}
      <div
        className="absolute -bottom-1/3 right-1/4 h-[450px] w-[450px] rounded-full bg-cyan-400/15 blur-[120px] animate-pulse"
        style={{ animationDuration: "4s", animationDelay: "1.5s" }}
      />

      {/* Noise overlay for texture */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50" />
    </div>
  )
}
