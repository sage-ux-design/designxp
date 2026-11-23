import { Search, TriangleAlert } from "lucide-react";
import type { VisualMockId } from "@/types";

/**
 * Small, annotated interface mock-ups for visual identification questions.
 * They are rendered as real (non-interactive) UI so they stay crisp and accessible.
 */
export function VisualMock({ id }: { id: VisualMockId }) {
  return (
    <figure className="mx-auto w-full max-w-md">
      <div className="bg-[#f6f3ff] p-5 text-[#1d1838] shadow-[6px_6px_0_0_rgba(0,0,0,0.45)] outline-4 outline-ring" aria-hidden="true">
        {id === "proximity" && <ProximityMock />}
        {id === "error-message" && <ErrorMock />}
        {id === "empty-search" && <EmptySearchMock />}
        {id === "competing-buttons" && <CompetingButtonsMock />}
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">{CAPTIONS[id]}</figcaption>
    </figure>
  );
}

const CAPTIONS: Record<VisualMockId, string> = {
  proximity: "Mock-up: a sign-up form where every label sits exactly halfway between two fields.",
  "error-message": "Mock-up: a date field showing the error \"Error 422: Invalid input\".",
  "empty-search": "Mock-up: search results for \"wireless hedphones\" showing only the words \"No results.\"",
  "competing-buttons": "Mock-up: a \"Delete your account?\" dialog with identical \"Cancel\" and \"Delete\" buttons.",
};

function Field() {
  return <div className="h-9 w-full rounded-sm border-2 border-[#c9c2e6] bg-white" />;
}

function ProximityMock() {
  return (
    <div className="text-sm">
      <p className="mb-4 font-bold">Create account</p>
      {["Full name", "Email", "Password"].map((l) => (
        <div key={l}>
          <div className="h-3" />
          <p className="text-[13px] text-[#4d4670]">{l}</p>
          <div className="h-3" />
          <Field />
        </div>
      ))}
    </div>
  );
}

function ErrorMock() {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-bold">Book your appointment</p>
      <label className="block text-[13px] text-[#4d4670]">Appointment date</label>
      <div className="flex h-9 items-center rounded-sm border-2 border-[#d3304a] bg-white px-2 text-[#1d1838]">9/5/26</div>
      <p className="flex items-center gap-1 text-[13px] font-bold text-[#d3304a]">
        <TriangleAlert className="size-3.5" /> Error 422: Invalid input
      </p>
    </div>
  );
}

function EmptySearchMock() {
  return (
    <div className="space-y-6 text-sm">
      <div className="flex h-10 items-center gap-2 rounded-sm border-2 border-[#c9c2e6] bg-white px-3">
        <Search className="size-4 text-[#6b648f]" />
        wireless hedphones
      </div>
      <p className="py-8 text-center text-[#6b648f]">No results.</p>
    </div>
  );
}

function CompetingButtonsMock() {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-base font-bold">Delete your account?</p>
      <p className="text-[#4d4670]">All projects, files and settings will be permanently removed.</p>
      <div className="flex justify-end gap-2">
        <span className="rounded-sm bg-[#6a46d8] px-4 py-2 font-bold text-white">Cancel</span>
        <span className="rounded-sm bg-[#6a46d8] px-4 py-2 font-bold text-white">Delete</span>
      </div>
    </div>
  );
}
