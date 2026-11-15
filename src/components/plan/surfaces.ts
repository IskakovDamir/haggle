// The three panel fills the plan uses, from the Figma app screens. Inline styles, because Tailwind
// cannot spell these multi-stop gradients from the hg-* tokens alone.

/** Pale blue, used when there is nothing urgent: the empty state, cards that are not charging interest. */
export const CALM_PANEL = { backgroundImage: "linear-gradient(135deg, #c4ddf6 0%, #e4effb 50%, #cfe0ff 100%)" };
/** Dark ink: the hero, the minimum-payment trap, asks you do yourself. */
export const INK_PANEL = { backgroundImage: "linear-gradient(135deg, #2b3446 0%, #0b1220 72%)" };
/** Bright blue: the one thing on the screen worth doing first. */
export const BLUE_PANEL = { backgroundImage: "linear-gradient(120deg, #2448f0 0%, #2f6bff 55%, #8db6ff 100%)" };

/** "Sample data", tinted blue as in the Figma app screens. Passed to SampleBadge as a className. */
export const SAMPLE_BADGE_CLASS = "bg-hg-blue-soft text-hg-blue [&>span]:bg-hg-blue";
