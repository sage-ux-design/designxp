import type { Phrase } from "../types";

export const PHRASES: Phrase[] = [
  {
    id: "reduce-cognitive-load",
    phrase: "Let's reduce cognitive load.",
    meaning: "Remove anything that makes people think harder than the task requires.",
    context: "Use it when a screen asks for too many decisions, shows too much at once, or makes people remember things.",
    example: "\"Before we add the promo banner, let's reduce cognitive load on checkout. People are already juggling address and payment.\"",
  },
  {
    id: "stronger-affordances",
    phrase: "We need stronger affordances.",
    meaning: "People can't tell what they can do with this element, so the design needs clearer cues.",
    context: "Use it when testers miss a clickable, draggable or swipeable element.",
    example: "\"Three of five testers never found the swipe. We need stronger affordances, maybe a peeking card or a handle.\"",
  },
  {
    id: "validate-assumption",
    phrase: "Let's validate the assumption before building.",
    meaning: "Test the belief the idea depends on before investing in the full solution.",
    context: "Use it when a big build rests on something nobody has evidence for yet.",
    example: "\"We're assuming shoppers trust AI picks. Let's validate the assumption with a concierge test before building the assistant.\"",
  },
  {
    id: "happy-path",
    phrase: "We're optimizing for the happy path.",
    meaning: "The design only covers the ideal scenario and ignores errors, empty data or edge cases.",
    context: "Use it in a review when nobody has designed the loading, error or empty states.",
    example: "\"This looks great, but we're optimizing for the happy path. What happens when the payment fails?\"",
  },
  {
    id: "address-empty-state",
    phrase: "We should address the empty state.",
    meaning: "The screen with no content yet needs to explain and guide, not just say \"No data\".",
    context: "Use it for first-time experiences, zero search results or cleared lists.",
    example: "\"New users land on a blank dashboard. We should address the empty state with a clear first action.\"",
  },
  {
    id: "interaction-friction",
    phrase: "This creates unnecessary interaction friction.",
    meaning: "Extra steps, taps or waits are slowing people down without adding value.",
    context: "Use it when a flow has redundant confirmations, extra screens or forced detours.",
    example: "\"Confirming every archive creates unnecessary interaction friction. Undo would be lighter.\"",
  },
  {
    id: "problem-vs-solution",
    phrase: "Let's distinguish the problem from the proposed solution.",
    meaning: "Separate what is going wrong from the fix someone has already suggested.",
    context: "Use it when a request arrives as a ready-made feature.",
    example: "\"Fewer screens is one solution. Let's distinguish the problem from the proposed solution and find out where people actually get stuck.\"",
  },
  {
    id: "improve-discoverability",
    phrase: "We need to improve discoverability.",
    meaning: "People can't find a feature that already exists.",
    context: "Use it when usage is low and research shows people don't know the feature is there.",
    example: "\"Bulk edit has been live for months but only 2% use it. We need to improve discoverability.\"",
  },
  {
    id: "guardrail-metrics",
    phrase: "Let's evaluate the guardrail metrics.",
    meaning: "Check that improving the target metric didn't quietly hurt something else.",
    context: "Use it when an experiment reports a win on one number.",
    example: "\"Clicks on Pay are up 12%. Before we ship, let's evaluate the guardrail metrics: failed payments and refunds.\"",
  },
  {
    id: "progressive-disclosure",
    phrase: "This is a progressive disclosure opportunity.",
    meaning: "Show the essentials first and reveal advanced options when people need them.",
    context: "Use it when a screen overwhelms new users with everything at once.",
    example: "\"Twelve filters on first load is a lot. This is a progressive disclosure opportunity.\"",
  },
  {
    id: "riskiest-assumption",
    phrase: "What's our riskiest assumption?",
    meaning: "Which belief, if wrong, would sink this idea?",
    context: "Use it at the start of discovery to decide what to test first.",
    example: "\"Before we estimate this, what's our riskiest assumption: that stores want it, or that customers will book?\"",
  },
  {
    id: "jtbd",
    phrase: "What job is the user hiring this for?",
    meaning: "What progress is the person trying to make in their situation?",
    context: "Use it to move a conversation from features to outcomes.",
    example: "\"People keep asking for a calendar. What job are they hiring it for? It sounds like avoiding surprise bills.\"",
  },
  {
    id: "information-scent",
    phrase: "This label has weak information scent.",
    meaning: "The label doesn't tell people what they'll find if they click it.",
    context: "Use it for vague navigation labels like \"More\", \"Resources\" or \"Explore\".",
    example: "\"Nobody finds the templates because 'Resources' has weak information scent. What if we call it 'Templates & guides'?\"",
  },
  {
    id: "human-in-the-loop",
    phrase: "Let's keep a human in the loop.",
    meaning: "Have a person review automated actions that carry real consequences.",
    context: "Use it in AI feature reviews when outputs reach customers, money or safety.",
    example: "\"The AI can draft the refund email, but let's keep a human in the loop before it's sent.\"",
  },
];

/** Phrase of the day rotates at 00:00 UTC. */
export function phraseOfTheDay(date = new Date()): Phrase {
  const day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
  return PHRASES[day % PHRASES.length];
}
