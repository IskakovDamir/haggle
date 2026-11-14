// Numbers said in words, as speech-to-text often writes them on a phone call: "forty dollar",
// "twenty seven point two four percent", "two hundred nine dollars and ninety three cents".
// Each becomes a figure in hundredths, the same unit the outcome check compares in.

const UNITS: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const DIGIT_WORDS: Record<string, number> = { ...Object.fromEntries(Object.entries(UNITS).filter(([, n]) => n < 10)) };

const isNumberWord = (word: string) => word in UNITS || word in TENS || word === "hundred" || word === "thousand";

/** Reads a whole number from words starting at `start`. Returns the value and where it stopped. */
function readWhole(words: string[], start: number): { value: number; end: number } | null {
  let total = 0;
  let current = 0;
  let i = start;
  let read = false;
  while (i < words.length) {
    const word = words[i];
    if (word === "and" && read && i + 1 < words.length && isNumberWord(words[i + 1]) && words[i + 1] !== "hundred") {
      // "two hundred and nine": "and" joins parts of one number.
      if (current >= 100 || total > 0) {
        i += 1;
        continue;
      }
      break;
    }
    if (word in UNITS) {
      current += UNITS[word];
    } else if (word in TENS) {
      current += TENS[word];
    } else if (word === "hundred") {
      if (!read) break;
      current = (current || 1) * 100;
    } else if (word === "thousand") {
      if (!read) break;
      total += (current || 1) * 1000;
      current = 0;
    } else {
      break;
    }
    read = true;
    i += 1;
  }
  return read ? { value: total + current, end: i } : null;
}

/** Every figure said in words in one line, in hundredths: "forty" is 4000, "twenty seven point two four" is 2724. */
export function spokenFigures(text: string): number[] {
  const words = text
    .toLowerCase()
    .replace(/-/g, " ")
    .split(/[^a-z]+/)
    .filter(Boolean);
  const figures: number[] = [];

  let i = 0;
  while (i < words.length) {
    const whole = readWhole(words, i);
    if (!whole) {
      i += 1;
      continue;
    }
    let hundredths = whole.value * 100;
    let end = whole.end;

    if (words[end] === "point") {
      // "point two four": up to two digit words after "point".
      const digits: number[] = [];
      let j = end + 1;
      while (j < words.length && digits.length < 2 && words[j] in DIGIT_WORDS) {
        digits.push(DIGIT_WORDS[words[j]]);
        j += 1;
      }
      if (digits.length > 0) {
        hundredths += digits.length === 1 ? digits[0] * 10 : digits[0] * 10 + digits[1];
        end = j;
      }
    } else if ((words[end] === "dollar" || words[end] === "dollars") && words[end + 1] === "and") {
      // "two hundred nine dollars and ninety three cents"
      const cents = readWhole(words, end + 2);
      if (cents && cents.value < 100 && (words[cents.end] === "cent" || words[cents.end] === "cents")) {
        figures.push(hundredths);
        hundredths += cents.value;
        end = cents.end + 1;
      }
    }

    figures.push(hundredths);
    i = Math.max(end, i + 1);
  }
  return figures;
}
