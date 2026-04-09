export function WaveformAnimation() {
  return (
    <div className="flex items-end justify-center gap-1.5 h-16" aria-label="음악 생성 중">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-primary-container"
          style={{
            animation: `waveform 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
            height: '20%',
          }}
        />
      ))}
      <style>{`
        @keyframes waveform {
          0%, 100% { height: 20%; opacity: 0.4; }
          50% { height: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  )
}
