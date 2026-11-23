// Extracts the 50 source questions from the Design Arcade PDF text dump.
// Usage:
//   pdftotext -layout content/design_arcade_50_product_design_situational_quiz.pdf content/quiz-source.txt
//   node scripts/extract-questions.mjs
// Output: data/source-questions.json (verbatim question text, options, answer, explanation, takeaway)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const txt = fs.readFileSync(path.join(root, "content/quiz-source.txt"), "utf8").replace(/\r/g, "");

const lines = txt.split("\n");
const isNoise = (l) =>
  /^DESIGN ARCADE \/ PRODUCT DESIGN SITUATIONAL QUIZ/.test(l.trim()) ||
  /^QUESTIONS \d+-\d+$/.test(l.trim()) ||
  /^Choose the strongest response for each situation/.test(l.trim()) ||
  /^\f/.test(l);

const questions = [];
let cur = null;
let section = null; // question | option | why | takeaway
const clean = (s) => s.replace(/\s+/g, " ").trim();

for (const raw of lines) {
  const line = raw.replace(/\f/g, "");
  if (/^QUICK ANSWER KEY/.test(line.trim())) break;
  if (isNoise(line)) continue;
  const t = line.trim();
  let m;
  if ((m = t.match(/^QUESTION (\d+) \/ (.+)$/))) {
    if (cur) questions.push(cur);
    cur = { number: Number(m[1]), module: m[2].trim(), question: "", options: [], answer: "", why: "", takeaway: "" };
    section = "question";
    continue;
  }
  if (!cur) continue;
  if (t === "") continue;
  if ((m = t.match(/^([A-D])\. (.+)$/)) && section !== "why" && section !== "takeaway") {
    cur.options.push({ key: m[1], text: m[2] });
    section = "option";
    continue;
  }
  if ((m = t.match(/^RIGHT ANSWER: ([A-D])$/))) {
    cur.answer = m[1];
    section = "answer";
    continue;
  }
  if ((m = t.match(/^Why: (.+)$/))) {
    cur.why = m[1];
    section = "why";
    continue;
  }
  if ((m = t.match(/^TAKEAWAY: (.+)$/))) {
    cur.takeaway = m[1];
    section = "takeaway";
    continue;
  }
  if (section === "question") cur.question += " " + t;
  else if (section === "option") cur.options[cur.options.length - 1].text += " " + t;
  else if (section === "why") cur.why += " " + t;
  else if (section === "takeaway") cur.takeaway += " " + t;
}
if (cur) questions.push(cur);

for (const q of questions) {
  q.question = clean(q.question);
  q.why = clean(q.why);
  q.takeaway = clean(q.takeaway);
  q.options = q.options.map((o) => ({ key: o.key, text: clean(o.text) }));
}

// Answer key from the "QUICK ANSWER KEY" page, used to cross-check every answer.
const keyStart = lines.findIndex((l) => /^QUICK ANSWER KEY/.test(l.trim()));
const answerKey = {};
for (const l of lines.slice(keyStart)) {
  for (const m of l.matchAll(/(?:^|\s{2,})(\d{2}) ([A-D])\s/g)) answerKey[Number(m[1])] = m[2];
}

const errors = [];
if (questions.length !== 50) errors.push(`Expected 50 questions, found ${questions.length}`);
questions.forEach((q, i) => {
  if (q.number !== i + 1) errors.push(`Question order broken at index ${i} (found ${q.number})`);
  if (q.options.length !== 4) errors.push(`Q${q.number}: ${q.options.length} options`);
  if (!q.answer) errors.push(`Q${q.number}: missing answer`);
  if (!q.why) errors.push(`Q${q.number}: missing explanation`);
  if (!q.takeaway) errors.push(`Q${q.number}: missing takeaway`);
  if (answerKey[q.number] && answerKey[q.number] !== q.answer)
    errors.push(`Q${q.number}: answer ${q.answer} does not match answer key ${answerKey[q.number]}`);
  if (!answerKey[q.number]) errors.push(`Q${q.number}: not found in answer key`);
});
const texts = new Set(questions.map((q) => q.question));
if (texts.size !== questions.length) errors.push("Duplicate question text found");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
fs.writeFileSync(path.join(root, "data/source-questions.json"), JSON.stringify(questions, null, 2) + "\n");
console.log(`Extracted ${questions.length} questions; all answers match the PDF answer key.`);
