const STATS = [["+۱۱۰", "هتل تأییدشده"], ["۱۰", "شهر محبوب"], ["۴٫۸", "میانگین رضایت"], ["۲۴/۷", "پشتیبانی فارسی"]];

export default function Stats() {
  return (
    <section className="mx-auto mt-20 grid max-w-6xl grid-cols-2 gap-y-6 px-5 text-center md:grid-cols-4">
      {STATS.map(([n, l]) => (
        <div key={l}>
          <b className="block text-4xl font-black" style={{ color: "var(--price)" }}>{n}</b>
          <span className="text-sm text-mut">{l}</span>
        </div>
      ))}
    </section>
  );
}
