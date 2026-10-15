"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "../HotelsProvider";
import { useNow } from "../useNow";
import { Badge, Btn, Card, Field, Modal, inputCls } from "./ui";
import { createOffer, deleteOffer, fetchAllOffers, updateOffer } from "@/lib/offers";
import { OFFER_LIMITS, offerState } from "@/lib/offerRules";
import { fa } from "@/lib/fa";

const pad = (n) => String(n).padStart(2, "0");
const toLocal = (d) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`; };
const fmtDate = (iso) => new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
const leftText = (ms) => {
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d ? `${fa(d)} روز و ${fa(h)} ساعت` : h ? `${fa(h)} ساعت و ${fa(m)} دقیقه` : `${fa(m)} دقیقه`;
};
const TONES = { live: ["ok", "فعال"], scheduled: ["info", "زمان‌بندی‌شده"], ended: ["bad", "پایان یافته"], paused: ["mut", "متوقف"] };

export default function OffersPanel({ notify }) {
  const { hotels } = useAdmin();
  const [items, setItems] = useState(null);
  const [edit, setEdit] = useState(null); // null | "new" | offer
  const [busy, setBusy] = useState("");
  const now = useNow(0);
  const hotelOf = useMemo(() => new Map(hotels.map((h) => [h.id, h])), [hotels]);

  const load = useCallback(
    () => fetchAllOffers().then((d) => setItems(d.items)).catch((e) => { setItems((p) => p ?? []); notify(e.message); }),
    [notify]
  );
  useEffect(() => { load(); }, [load]);

  const run = async (key, fn, okMsg) => {
    setBusy(key);
    try { await fn(); await load(); notify(okMsg); }
    catch (e) { notify(e.message); }
    finally { setBusy(""); }
  };
  const toggle = (o) => run(o.id, () => updateOffer(o.id, { active: !o.active }), o.active ? "پیشنهاد متوقف شد و از سایت جمع شد." : "پیشنهاد دوباره فعال شد.");
  const extend = (o, days) => run(o.id, () => updateOffer(o.id, { endsAt: new Date(Math.max(Date.parse(o.endsAt), Date.now()) + days * 864e5).toISOString() }), `${fa(days)} روز تمدید شد.`);
  const remove = (o) => {
    if (!window.confirm("این پیشنهاد برای همیشه حذف شود؟")) return;
    run(o.id, () => deleteOffer(o.id), "پیشنهاد حذف شد.");
  };

  return (
    <div className="space-y-5">
      <Card title="🔥 پیشنهادهای ویژه" action={<Btn kind="primary" onClick={() => setEdit("new")}>+ پیشنهاد جدید</Btn>}>
        <p className="text-sm text-mut">
          هر پیشنهاد روی صفحه‌ی اصلی در اسلایدر با تایمر نمایش داده می‌شود. وقتی زمانش تمام شود یا اینجا متوقفش کنی، دکمه‌ی رزرو بسته می‌شود و سرور هم رزرو با آن تخفیف را قبول نمی‌کند.
        </p>
      </Card>

      {items === null ? (
        <p className="text-mut">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <Card><p className="py-6 text-center text-mut">هنوز پیشنهادی نساخته‌ای.</p></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((o) => {
            const st = offerState(o, now);
            const [tone, label] = TONES[st];
            const h = hotelOf.get(o.hotelId);
            const left = Date.parse(o.endsAt) - now;
            return (
              <Card key={o.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <b className="block text-lg">{h ? h.name : `هتل شماره ${fa(o.hotelId)}`}</b>
                    <span className="text-xs text-mut">{h?.city}{o.title ? ` · ${o.title}` : ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="info">{fa(o.discountPct)}٪ تخفیف</Badge>
                    <Badge tone={tone}>{label}</Badge>
                  </div>
                </div>
                <dl className="grid gap-1 text-sm">
                  <div className="flex justify-between"><dt className="text-mut">شروع</dt><dd>{fmtDate(o.startsAt)}</dd></div>
                  <div className="flex justify-between"><dt className="text-mut">پایان</dt><dd>{fmtDate(o.endsAt)}</dd></div>
                  {st === "live" && <div className="flex justify-between"><dt className="text-mut">باقی‌مانده</dt><dd className="font-bold">{leftText(left)}</dd></div>}
                </dl>
                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                  <Btn disabled={busy === o.id} onClick={() => toggle(o)}>{o.active ? "توقف" : "فعال‌سازی"}</Btn>
                  <Btn disabled={busy === o.id} onClick={() => extend(o, 1)}>+۱ روز</Btn>
                  <Btn disabled={busy === o.id} onClick={() => extend(o, 7)}>+۷ روز</Btn>
                  <Btn kind="soft" onClick={() => setEdit(o)}>ویرایش</Btn>
                  <Btn kind="danger" disabled={busy === o.id} onClick={() => remove(o)}>حذف</Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {edit && (
        <OfferForm
          initial={edit === "new" ? null : edit}
          hotels={hotels}
          onClose={() => setEdit(null)}
          onSaved={(msg) => { setEdit(null); load(); notify(msg); }}
        />
      )}
    </div>
  );
}

function OfferForm({ initial, hotels, onClose, onSaved }) {
  const sorted = useMemo(() => [...hotels].sort((a, b) => a.name.localeCompare(b.name, "fa")), [hotels]);
  const [f, setF] = useState(() => ({
    hotelId: initial?.hotelId ?? sorted[0]?.id ?? "",
    title: initial?.title ?? "",
    discountPct: initial?.discountPct ?? 20,
    startsAt: toLocal(initial?.startsAt ?? Date.now()),
    endsAt: toLocal(initial?.endsAt ?? Date.now() + 7 * 864e5),
    active: initial?.active ?? true,
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const save = async () => {
    const body = {
      hotelId: Number(f.hotelId), title: f.title, discountPct: Number(f.discountPct), active: f.active,
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : "",
      endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : "",
    };
    setSaving(true); setErrors({});
    try {
      if (initial) await updateOffer(initial.id, body); else await createOffer(body);
      onSaved(initial ? "پیشنهاد ذخیره شد." : "پیشنهاد ساخته شد.");
    } catch (e) {
      setErrors(e.errors || { form: e.message });
    } finally { setSaving(false); }
  };

  return (
    <Modal title={initial ? "ویرایش پیشنهاد ویژه" : "پیشنهاد ویژه‌ی جدید"} onClose={onClose}>
      <div className="grid gap-4">
        <Field label="هتل" error={errors.hotelId}>
          <select value={f.hotelId} onChange={set("hotelId")} className={inputCls}>
            {sorted.map((h) => <option key={h.id} value={h.id}>{h.name} — {h.city}</option>)}
          </select>
        </Field>
        <Field label="عنوان کوتاه (اختیاری)" hint="مثلاً «ویژه‌ی آخر هفته»" error={errors.title}>
          <input value={f.title} onChange={set("title")} maxLength={80} className={inputCls} />
        </Field>
        <Field label="درصد تخفیف" hint={`عدد صحیح ${OFFER_LIMITS.minPct} تا ${OFFER_LIMITS.maxPct}`} error={errors.discountPct}>
          <input type="number" min={OFFER_LIMITS.minPct} max={OFFER_LIMITS.maxPct} value={f.discountPct} onChange={set("discountPct")} className={inputCls} dir="ltr" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="شروع" error={errors.startsAt}><input type="datetime-local" value={f.startsAt} onChange={set("startsAt")} className={inputCls} dir="ltr" /></Field>
          <Field label="پایان" error={errors.endsAt}><input type="datetime-local" value={f.endsAt} onChange={set("endsAt")} className={inputCls} dir="ltr" /></Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={f.active} onChange={set("active")} className="h-4 w-4 accent-violet" />
          فعال (اگر خاموش باشد در سایت نمایش داده نمی‌شود)
        </label>
        {errors.form && <p role="alert" className="text-sm text-coral">{errors.form}</p>}
        <div className="flex justify-end gap-2">
          <Btn onClick={onClose}>انصراف</Btn>
          <Btn kind="primary" disabled={saving} onClick={save}>{saving ? "در حال ذخیره…" : "ذخیره"}</Btn>
        </div>
      </div>
    </Modal>
  );
}
