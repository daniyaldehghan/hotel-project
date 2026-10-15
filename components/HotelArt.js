export const THEMES = {
  باکو: ["#6C3BFF", "#FF5E7A"], استانبول: ["#FF5E7A", "#FFC83D"], تهران: ["#0FA8B8", "#6C3BFF"],
  دبی: ["#FFC83D", "#FF5E7A"], تفلیس: ["#22C79A", "#6C3BFF"], آنتالیا: ["#22E3D2", "#2A6BFF"],
  شیراز: ["#FF8A5C", "#9B2DFF"], ایروان: ["#FF5E7A", "#9B2DFF"], اصفهان: ["#22C79A", "#FFC83D"], تبریز: ["#2A6BFF", "#FF5E7A"],
};

export default function HotelArt({ hotel }) {
  const [a, b] = THEMES[hotel.city];
  const id = `g${hotel.id}`;
  const s = hotel.id * 37;
  return (
    <svg viewBox="0 0 300 158" preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="300" height="158" fill={`url(#${id})`} />
      <circle cx={60 + (s % 180)} cy="44" r="22" fill="#fff" opacity=".35" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const w = 28 + ((s * (i + 3)) % 22);
        const h = 40 + ((s * (i + 5)) % 70);
        return <rect key={i} x={i * 50 + 6} y={158 - h} width={w} height={h} fill="#fff" opacity={0.12 + (i % 3) * 0.08} />;
      })}
    </svg>
  );
}
