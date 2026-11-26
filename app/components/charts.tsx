// Graphiques SVG légers (sans bibliothèque) : courbe avec aire, sparkline, barres, anneau
import { useId } from 'react';

const nice = (v: number) => {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};
export const kfmt = (v: number) => (v >= 1e6 ? `${(v / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M` : v >= 1000 ? `${Math.round(v / 1000)} k` : String(Math.round(v)));

// Courbe principale (période en cours, aire dégradée) et période précédente en pointillés
export function AreaChart({ values, prev, labels, height = 210, color = '#C94310', label, format = kfmt }: {
  values: number[]; prev?: number[]; labels: string[]; height?: number; color?: string; label: string; format?: (v: number) => string;
}) {
  const id = useId().replace(/:/g, '');
  const W = 640, H = height, L = 40, R = 12, T = 12, B = 24;
  const max = nice(Math.max(1, ...values, ...(prev || [])) * 1.1);
  const n = Math.max(values.length, 2);
  const x = (i: number) => L + (i * (W - L - R)) / (n - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  // Courbe lissée (Catmull-Rom convertie en Bézier), sans dépasser la ligne zéro
  const path = (vs: number[]) => vs.map((v, i) => {
    if (!i) return `M${x(0).toFixed(1)},${y(v).toFixed(1)}`;
    const p0 = vs[i - 2] ?? vs[i - 1], p1 = vs[i - 1], p3 = vs[i + 1] ?? v;
    const c1x = x(i - 1) + (x(i) - x(Math.max(0, i - 2))) / 6, c1y = Math.min(H - B, y(p1) + (y(v) - y(p0)) / 6);
    const c2x = x(i) - (x(Math.min(vs.length - 1, i + 1)) - x(i - 1)) / 6, c2y = Math.min(H - B, y(v) - (y(p3) - y(p1)) / 6);
    return `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x(i).toFixed(1)},${y(v).toFixed(1)}`;
  }).join(' ');
  const line = path(values);
  const area = `${line} L${x(values.length - 1)},${H - B} L${x(0)},${H - B} Z`;
  const ticks = [0, 1, 2, 3, 4].map((k) => (max * k) / 4);
  const every = Math.max(1, Math.ceil(labels.length / 10));
  const last = values.length - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label}>
      <defs><linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {ticks.map((t) => (
        <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#EDE3D3" strokeDasharray={t ? '0' : '0'} />
          <text x={L - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#9AA0B8">{format(t)}</text></g>
      ))}
      {labels.map((l, i) => (i % every === 0 || i === labels.length - 1) && <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#9AA0B8">{l}</text>)}
      {prev && <path d={path(prev)} fill="none" stroke="#9AA0B8" strokeWidth="1.6" strokeDasharray="5 5" />}
      <path d={area} fill={`url(#g${id})`} className="chart-fade" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="chart-draw" />
      {last >= 0 && <circle cx={x(last)} cy={y(values[last])} r="5.5" fill="#fff" stroke={color} strokeWidth="2.6" className="chart-fade" />}
      {values.map((v, i) => <rect key={i} x={x(i) - (W - L - R) / n / 2} y={T} width={(W - L - R) / n} height={H - T - B} fill="transparent"><title>{`${labels[i]} : ${format(v)}${prev ? ` (précédent : ${format(prev[i] || 0)})` : ''}`}</title></rect>)}
    </svg>
  );
}

export function Spark({ values, color = '#0B7F7C', w = 90, h = 28 }: { values: number[]; color?: string; w?: number; h?: number }) {
  if (!values.length) return null;
  const max = Math.max(1, ...values), min = Math.min(...values);
  const pts = values.map((v, i) => `${((i * w) / Math.max(1, values.length - 1)).toFixed(1)},${(h - 3 - ((v - min) / Math.max(1, max - min)) * (h - 6)).toFixed(1)}`).join(' ');
  // Se réduit si la carte est étroite (téléphone : 2 cartes par ligne), au lieu de déborder de la carte
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden className="min-w-0 shrink"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="chart-draw" /></svg>;
}

// Barres verticales ; la dernière (mois en cours) en orange
export function Bars({ values, labels, height = 180, label, format = kfmt }: { values: number[]; labels: string[]; height?: number; label: string; format?: (v: number) => string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-4 md:gap-7 px-2" style={{ height }} role="img" aria-label={label}>
      {values.map((v, i) => (
        <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group" title={`${labels[i]} : ${format(v)}`}>
          <span className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">{format(v)}</span>
          <span className={`w-full max-w-11 rounded-t-md origin-bottom bar-grow ${i === values.length - 1 ? 'bg-orange' : 'bg-indigo'}`} style={{ height: `${Math.max(2, (v / max) * 100)}%`, animationDelay: `${i * 70}ms` }} />
          <span className="text-[10.5px] text-muted">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ parts, size = 140, thick = 18, center, sub }: { parts: { value: number; color: string; label: string }[]; size?: number; thick?: number; center: React.ReactNode; sub?: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const r = (size - thick) / 2, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={parts.map((p) => `${p.label} ${Math.round((p.value / (total || 1)) * 100)} %`).join(', ')}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F7EDDD" strokeWidth={thick} />
        {total > 0 && parts.map((p) => {
          const len = (p.value / total) * c;
          const el = <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={thick} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} className="chart-fade" />;
          off += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-2xl font-semibold text-ink leading-none">{center}</span>{sub && <span className="text-[11px] text-muted mt-1">{sub}</span>}</div>
    </div>
  );
}

// Variation en pourcentage par rapport à la période précédente
export function Delta({ now, before, suffix = '%' }: { now: number; before: number; suffix?: string }) {
  if (!before && !now) return <span className="chip bg-sable-2 text-muted">=</span>;
  if (!before) return <span className="chip bg-turquoise-50 text-turquoise">Nouveau</span>;
  const d = Math.round(((now - before) / before) * 100);
  return <span className={`chip ${d >= 0 ? 'bg-turquoise-50 text-turquoise' : 'bg-red-50 text-red-700'}`}>{d >= 0 ? '↑' : '↓'} {d >= 0 ? '+' : ''}{d} {suffix}</span>;
}
