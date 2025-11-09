"use client";

import {useEffect, useMemo, useState} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {TabView, TabPanel} from "primereact/tabview";
import {InputText} from "primereact/inputtext";
import {Button} from "primereact/button";
import {Tag as PTag} from "primereact/tag";
import {useTranslations} from "next-intl";
import {Checkbox} from "primereact/checkbox";
import {Slider} from "primereact/slider";

import {mockPost} from "@/lib/mockTest/mockPost";
import type {PhotoPost} from "@/types";

/* ==================== Utils & Mock helpers ==================== */
type Mode = "keyword" | "tag" | "color" | "ai" | "trending" | "combined";

function asArray<T>(x: T | T[] | undefined | null): T[] {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

// Rough hex distance by RGB for dominant color search
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function colorDistance(h1: string, h2: string) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
  return Math.sqrt(dr*dr + dg*dg + db*db);
}

// Build trending tags from mock
function topTags(posts: PhotoPost[], limit = 12) {
  const freq = new Map<string, number>();
  posts.forEach(p => (p.tags ?? []).forEach(t => freq.set(t, (freq.get(t) ?? 0) + 1)));
  return [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([t])=>t);
}

/* ==================== Small UI bits ==================== */
function ResultCard({p}: {p: PhotoPost}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-neutral-900/60 shadow-sm hover:shadow-md transition-shadow">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.imageUrl}
        alt={p.alt ?? ""}
        className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />
      <div className="absolute inset-x-0 bottom-0 p-3 text-xs bg-gradient-to-t from-black/60 to-transparent text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><i className="pi pi-heart" /> {p.likeCount}</span>
            <span className="inline-flex items-center gap-1"><i className="pi pi-comments" /> {p.commentCount}</span>
          </div>
          <div className="flex gap-1">
            {(p.tags ?? []).slice(0,2).map(t => (
              <PTag key={t} value={t} rounded className="!text-[10px] !px-2 !py-1 bg-white/20 border-0" />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function ResultGrid({items}: {items: PhotoPost[]}) {
  if (!items.length) {
    return (
      <div className="grid place-items-center h-60 text-sm opacity-70">
        No results. Try another query.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
      {items.map(p => <ResultCard key={p.id} p={p} />)}
    </div>
  );
}

function Section({children}: {children: React.ReactNode}) {
  return <section className="mb-12">{children}</section>;
}

/* ==================== Page ==================== */
export default function SearchPage() {
  const t = useTranslations("Search");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // URL state
  const [mode, setMode] = useState<Mode>((sp.get("mode") as Mode) || "keyword");
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [tag, setTag] = useState(sp.get("tag") ?? "");
  const [color, setColor] = useState(sp.get("color") ?? "#e11d48"); // default rose-600
  const [aiPrompt, setAiPrompt] = useState(sp.get("prompt") ?? "");
  const [strictColor, setStrictColor] = useState(sp.get("strict") === "1");
  const [colorTolerance, setColorTolerance] = useState(Number(sp.get("tol") ?? 100));
  // Combined mode extras
  const [tagsMulti, setTagsMulti] = useState<string[]>([]);
  const [matchAllTags, setMatchAllTags] = useState<boolean>(true);

  // Sync URL when inputs change
  useEffect(() => {
    const params = new URLSearchParams(sp.toString());
    params.set("mode", mode);
    // prune irrelevant
    ["q","tag","color","prompt","strict","tol"].forEach(k => params.delete(k));

    if (mode === "keyword" && q) params.set("q", q);
    if (mode === "tag" && tag) params.set("tag", tag);
    if (mode === "color") {
      params.set("color", color);
      if (strictColor) params.set("strict","1");
      if (colorTolerance !== 100) params.set("tol", String(colorTolerance));
    }
    if (mode === "ai" && aiPrompt) params.set("prompt", aiPrompt);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, q, tag, color, aiPrompt, strictColor, colorTolerance]);

  const posts = useMemo(() => asArray<PhotoPost>(mockPost), []);
  const trending = useMemo(() => topTags(posts), [posts]);
  
  // thêm ngay trên phần useMemo của kết quả
const haystackOf = (p: PhotoPost) => {
  const anyp = p as any;
  // ưu tiên caption/title nếu có; fallback alt + tags
  const caption = (anyp.caption ?? anyp.title ?? "") as string;
  const tags = (p.tags ?? []).join(" ");
  const alt = p.alt ?? "";
  return `${caption} ${alt} ${tags}`.toLowerCase();
};

  
  // Core searchers
  const keywordResults = useMemo(() => {
  if (!q.trim()) return [];
  const k = q.toLowerCase();
  return posts.filter(p => haystackOf(p).includes(k));
}, [q, posts]);

  const tagResults = useMemo(() => {
    const needle = tag.trim().toLowerCase();
    if (!needle) return [];
    return posts.filter(p => (p.tags ?? []).map(t => t.toLowerCase()).includes(needle));
  }, [tag, posts]);

  const colorResults = useMemo(() => {
    // assume p.dominantColor exists in some mock; fallback to #999999
    const want = color.toLowerCase();
    return posts
      .map(p => ({ p, col: (p as any).dominantColor ?? "#999999" }))
      .map(({p, col}) => ({ p, dist: colorDistance(want, String(col).toLowerCase()) }))
      .filter(x => strictColor ? x.dist < 5 : x.dist <= colorTolerance)
      .sort((a,b)=>a.dist-b.dist)
      .map(x => x.p);
  }, [color, strictColor, colorTolerance, posts]);

  const aiResults = useMemo(() => {
  const words = aiPrompt.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return posts.filter(p => {
    const hay = haystackOf(p);
    return words.every(w => hay.includes(w));
  });
}, [aiPrompt, posts]);

  const trendingResults = useMemo(() => {
    // Mix: top-liked + recent? We only have mock; use likeCount desc as a proxy
    return [...posts].sort((a,b)=> (b.likeCount ?? 0) - (a.likeCount ?? 0)).slice(0, 24);
  }, [posts]);

  // Combined results (AND across non-empty controls)
  const combinedResults = useMemo(() => {
    return posts.filter(p => {
      // keyword
      if (q.trim()) {
        if (!haystackOf(p).includes(q.toLowerCase())) return false;
      }
      // tags
      if (tagsMulti.length) {
        const ptags = (p.tags ?? []).map(t => t.toLowerCase());
        const lower = tagsMulti.map(t => t.toLowerCase().trim()).filter(Boolean);
        if (lower.length) {
          if (matchAllTags) {
            if (!lower.every(t => ptags.includes(t))) return false;
          } else {
            if (!lower.some(t => ptags.includes(t))) return false;
          }
        }
      }
      // color
      if (color) {
        const col = String((p as any).dominantColor ?? "#999999").toLowerCase();
        const dist = colorDistance(color.toLowerCase(), col);
        if (strictColor ? dist >= 5 : dist > colorTolerance) return false;
      }
      // ai prompt
      if (aiPrompt.trim()) {
        const words = aiPrompt.toLowerCase().split(/\s+/).filter(Boolean);
        if (words.length && !words.every(w => haystackOf(p).includes(w))) return false;
      }
      return true;
    });
  }, [posts, q, tagsMulti, matchAllTags, color, strictColor, colorTolerance, aiPrompt]);

  // Active result
  const results = useMemo(() => {
    switch (mode) {
      case "keyword": return keywordResults;
      case "tag": return tagResults;
      case "color": return colorResults;
      case "ai": return aiResults;
      case "trending": return trendingResults;
      case "combined": return combinedResults;
    }
  }, [mode, keywordResults, tagResults, colorResults, aiResults, trendingResults, combinedResults]);

  // Quick apply tag/color from chips
  const applyTag = (t: string) => {
    setMode("tag");
    setTag(t);
  };

  /* ==================== UI ==================== */
  return (
    <div className="min-h-screen pb-24">
      {/* Hero / Sticky filter bar */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-[var(--surface-ground,transparent)]/70 border-b border-black/5 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xl font-semibold flex items-center gap-2">
              <i className="pi pi-search" /> Explore
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs opacity-60">
              <i className="pi pi-bolt" /> Smart search: keyword • tag • color • AI
            </div>
          </div>

          {/* Tabs header */}
          <div className="mt-3">
            <TabView
              activeIndex={["keyword","tag","color","ai","trending"].indexOf(mode)}
              onTabChange={(e) => setMode(["keyword","tag","color","ai","trending","combined"][e.index] as Mode)}
              pt={{
    navContainer: { className: "sticky top-0 z-40 bg-[var(--surface-ground,transparent)]/80 backdrop-blur-md rounded-t-2xl" },
    panelContainer: { className: "rounded-b-2xl" },
    inkbar: { className: "bg-red-500 h-[3px]" }
  }}
            >
              <TabPanel header={<span className="inline-flex items-center gap-2"><i className="pi pi-align-left" />Keyword</span>}>
                <div className="flex w-full items-center gap-2">
                  <span className="p-input-icon-left flex-1">
                    <i className="pi pi-search" />
                    <InputText
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search photos, captions, tags…"
                      className="w-full"
                    />
                  </span>
                  <Button label="Search" onClick={()=>setMode("keyword")} />
                </div>
              </TabPanel>

              <TabPanel header={<span className="inline-flex items-center gap-2"><i className="pi pi-hashtag" />Tag</span>}>
                <div className="flex w-full items-center gap-2">
                  <span className="p-input-icon-left flex-1">
                    <i className="pi pi-hashtag" />
                    <InputText
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      placeholder="e.g. nature, portrait, cityscape…"
                      className="w-full"
                    />
                  </span>
                  <Button label="Apply" onClick={()=>setMode("tag")} />
                </div>
                {/* Quick trending tags */}
                {!!trending.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {trending.slice(0, 10).map(tg => (
                      <button
                        key={tg}
                        onClick={()=>applyTag(tg)}
                        className="text-xs px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                      >
                        #{tg}
                      </button>
                    ))}
                  </div>
                )}
              </TabPanel>

              <TabPanel header={<span className="inline-flex items-center gap-2"><i className="pi pi-palette" />Color</span>}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="col-span-2 flex items-center gap-3">
                    {/* Simple swatches */}
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {["#ef4444","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#111827","#f5f5f5"].map(c => (
                        <button
                          key={c}
                          onClick={()=>setColor(c)}
                          title={c}
                          className={`w-8 h-8 rounded-full ring-2 ${color===c ? "ring-black/70 dark:ring-white/80" : "ring-black/10 dark:ring-white/10"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-70">Hex</span>
                      <InputText value={color} onChange={e=>setColor(e.target.value)} className="w-32" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox inputId="strict" checked={strictColor} onChange={e=>setStrictColor(!!e.checked)} />
                      <label htmlFor="strict" className="text-sm">Strict</label>
                    </div>
                    {!strictColor && (
                      <div className="flex items-center gap-2 w-48">
                        <span className="text-xs opacity-70">Tolerance</span>
                        <Slider value={colorTolerance} onChange={(e:any)=>setColorTolerance(e.value)} min={20} max={300} className="flex-1" />
                        <span className="text-xs w-8 text-right">{colorTolerance}</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabPanel>

              <TabPanel header={<span className="inline-flex items-center gap-2"><i className="pi pi-sparkles" />AI Prompt</span>}>
                <div className="flex w-full items-center gap-2">
                  <textarea
                    value={aiPrompt}
                    onChange={(e)=>setAiPrompt(e.target.value)}
                    placeholder="Describe the photo you want: 'sunset over mountains, warm tones, minimalism'"
                    className="w-full min-h-12 p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 outline-none"
                  />
                  <Button label="Generate" onClick={()=>setMode("ai")} icon="pi pi-magic" />
                </div>
                <p className="mt-2 text-xs opacity-60">Prototype: local semantic match over captions & tags.</p>
              </TabPanel>

              <TabPanel header={<span className="inline-flex items-center gap-2"><i className="pi pi-chart-line" />Trending</span>}>
                <div className="text-sm opacity-70">Top photos right now • Based on likes in mock data</div>
              </TabPanel>
                          <TabPanel header={<span className="inline-flex items-center gap-2"><i className="pi pi-sliders-h" />Combined</span>}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Keyword */}
                  <div className="flex items-center gap-2">
                    <span className="p-input-icon-left w-full">
                      <i className="pi pi-search" />
                      <InputText value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Keywords" className="w-full" />
                    </span>
                  </div>

                  {/* Tags (multi) */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-70 min-w-[56px]">Tags</span>
                    <input
                      className="flex-1 p-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
                      placeholder="portrait, travel, street"
                      value={tagsMulti.join(", ")}
                      onChange={(e)=> setTagsMulti(e.target.value.split(",").map(s=>s.trim()).filter(Boolean))}
                    />
                    <div className="flex items-center gap-2 ml-2">
                      <Checkbox inputId="alltags" checked={matchAllTags} onChange={(e)=>setMatchAllTags(!!e.checked)} />
                      <label htmlFor="alltags" className="text-sm">Match all</label>
                    </div>
                  </div>

                  {/* Color */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm opacity-70">Color</span>
                      <InputText value={color} onChange={(e)=>setColor(e.target.value)} className="w-32" />
                      <div className="w-6 h-6 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: color }} />
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <Checkbox inputId="allcolor" checked={strictColor} onChange={(e)=>setStrictColor(!!e.checked)} />
                      <label htmlFor="allcolor" className="text-sm">Strict</label>
                      {!strictColor && (
                        <>
                          <span className="text-xs opacity-70">Tol</span>
                          <Slider value={colorTolerance} onChange={(e:any)=>setColorTolerance(e.value)} min={20} max={300} className="w-40" />
                          <span className="text-xs w-8 text-right">{colorTolerance}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* AI prompt */}
                  <div className="flex items-center gap-2 lg:col-span-2">
                    <textarea
                      value={aiPrompt}
                      onChange={(e)=>setAiPrompt(e.target.value)}
                      placeholder="Describe the photo you want"
                      className="w-full min-h-12 p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 outline-none"
                    />
                    <Button label="Apply" icon="pi pi-filter" onClick={()=>setMode("combined")} />
                  </div>
                </div>
              </TabPanel></TabView>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-6 mt-8">
        <Section>
          <ResultGrid items={results} />
        </Section>
      </div>
    </div>
  );
}


