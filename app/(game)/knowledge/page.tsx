"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Search } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { ConceptDialog } from "@/components/knowledge/concept-dialog";
import { KnowledgeCard } from "@/components/knowledge/knowledge-card";
import { Input } from "@/components/ui/8bit/input";
import { Progress } from "@/components/ui/8bit/progress";
import { CONCEPT_CATEGORIES, CONCEPTS, CONCEPTS_BY_ID } from "@/data/concepts";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { usePlayer } from "@/hooks/use-player";
import { cn } from "@/lib/utils";

type Filter = "all" | "unlocked" | "locked" | "bookmarked";

function KnowledgeLibrary() {
  const { player } = usePlayer();
  const marks = useBookmarks("concepts");
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const openId = params.get("concept");

  const unlocked = useMemo(() => new Set(player?.unlockedConcepts.map((c) => c.conceptId)), [player]);
  const total = CONCEPTS.length;
  const pct = Math.round((unlocked.size / total) * 100);

  const visible = CONCEPTS.map((c, i) => ({ c, n: i + 1 })).filter(({ c }) => {
    const isUnlocked = unlocked.has(c.id);
    if (category !== "all" && c.category !== category) return false;
    if (filter === "unlocked" && !isUnlocked) return false;
    if (filter === "locked" && isUnlocked) return false;
    if (filter === "bookmarked" && !marks.has(c.id)) return false;
    if (query.trim()) {
      // Locked cards are searchable by category only, so names stay a surprise.
      const q = query.toLowerCase();
      const hay = isUnlocked ? `${c.name} ${c.simpleDefinition} ${c.category}` : c.category;
      if (!hay.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const open = (id: string | null) => {
    const url = id ? `/knowledge?concept=${id}` : "/knowledge";
    router.replace(url, { scroll: false });
  };

  const openConcept = openId ? CONCEPTS_BY_ID[openId] ?? null : null;

  return (
    <div>
      <PageHeader
        eyebrow="ITEM INVENTORY"
        title="KNOWLEDGE LIBRARY"
        subtitle="Every question you answer adds a card to your collection. Open a card to revisit the idea, an example and how to talk about it."
      />

      <section className="pixel-frame mb-8 space-y-3 p-5" aria-label="Collection progress">
        <div className="flex items-baseline justify-between">
          <p className="font-pixel text-[10px] text-lavender">COLLECTION</p>
          <p className="font-pixel text-xs text-amber">
            {unlocked.size}/{total} <span className="text-muted-foreground">({pct}%)</span>
          </p>
        </div>
        <Progress value={pct} variant="retro" progressBg="bg-gold" className="h-4" aria-label={`Collection ${pct}% complete`} />
      </section>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <label htmlFor="kq" className="sr-only">
            Search concepts
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="kq"
            font="normal"
            placeholder="Search concepts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
          {(["all", "unlocked", "locked", "bookmarked"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-bold capitalize outline-2",
                filter === f ? "bg-primary text-white outline-primary" : "bg-surface text-muted-foreground outline-ring hover:text-cream",
              )}
            >
              {f === "bookmarked" && <Bookmark className="size-3.5" aria-hidden="true" />}
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Category">
        {["all", ...CONCEPT_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            aria-pressed={category === cat}
            className={cn(
              "shrink-0 px-3 py-1.5 text-xs font-bold outline-2",
              category === cat ? "bg-lavender text-[#261527] outline-lavender" : "bg-surface text-muted-foreground outline-ring hover:text-cream",
            )}
          >
            {cat === "all" ? "All categories" : cat}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-pixel text-xs text-cream">NO CARDS FOUND</p>
          <p className="mt-3 text-muted-foreground">
            {filter === "bookmarked" ? "Bookmark a card to find it here quickly." : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map(({ c, n }) => (
            <li key={c.id}>
              <KnowledgeCard
                concept={c}
                number={n}
                unlocked={unlocked.has(c.id)}
                bookmarked={marks.has(c.id)}
                onOpen={() => open(c.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <ConceptDialog
        concept={openConcept}
        unlocked={!!openConcept && unlocked.has(openConcept.id)}
        bookmarked={!!openConcept && marks.has(openConcept.id)}
        onToggleBookmark={() => openConcept && marks.toggle(openConcept.id)}
        onClose={() => open(null)}
      />
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense>
      <KnowledgeLibrary />
    </Suspense>
  );
}
