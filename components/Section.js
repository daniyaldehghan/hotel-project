export default function Section({ id, title, sub, children, narrow = false }) {
  return (
    <section id={id} className={`mx-auto mt-20 w-full scroll-mt-20 px-5 ${narrow ? "max-w-3xl" : "max-w-6xl"}`}>
      <h2 className="text-[28px] font-extrabold sm:text-[32px]">{title}</h2>
      {sub && <p className="mb-6 mt-1 max-w-xl text-mut">{sub}</p>}
      {children}
    </section>
  );
}
