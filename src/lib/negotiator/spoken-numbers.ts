// Numbers said in words, as speech-to-text often writes them on a phone call: "forty dollar",
// "twenty seven point two four percent", "two hundred nine dollars and ninety three cents".
// Each becomes a figure in hundredths, the same unit the outcome check compares in.

// English and Spanish words share one table. Spanish is read without accents ("dolares", "veintiun").
const UNITS: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veintiun: 21, veintiuno: 21, veintidos: 22, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
};
/** Spanish hundreds are single words: "doscientos" is 200. */
const HUNDREDS: Record<string, number> = {
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
};
const DIGIT_WORDS: Record<string, number> = { ...Object.fromEntries(Object.entries(UNITS).filter(([, n]) => n < 10)) };

const THOUSAND = new Set(["thousand", "mil"]);
const POINT = new Set(["point", "punto", "coma"]);
const CURRENCY = new Set(["dollar", "dollars", "dolar", "dolares"]);
const CENTS = new Set(["cent", "cents", "centavo", "centavos"]);
/** "and" joins parts of one number: "two hundred and nine", "cuarenta y cinco", "dólares con noventa". */
const JOINERS = new Set(["and", "y", "con"]);

const isNumberWord = (word: string) => word in UNITS || word in TENS || word in HUNDREDS || word === "hundred" || THOUSAND.has(word);

/** Reads a whole number from words starting at `start`. Returns the value and where it stopped. */
function readWhole(words: string[], start: number): { value: number; end: number } | null {
  let total = 0;
  let current = 0;
  let i = start;
  let read = false;
  while (i < words.length) {
    const word = words[i];
    if ((word === "and" || word === "y") && read && i + 1 < words.length && isNumberWord(words[i + 1]) && words[i + 1] !== "hundred") {
      // "two hundred and nine" and "cuarenta y cinco": the joiner sits inside one number.
      if (current >= 100 || total > 0 || (word === "y" && current % 10 === 0 && current >= 20)) {
        i += 1;
        continue;
      }
      break;
    }
    if (word in UNITS) {
      current += UNITS[word];
    } else if (word in TENS) {
      current += TENS[word];
    } else if (word in HUNDREDS) {
      current += HUNDREDS[word];
    } else if (word === "hundred") {
      if (!read) break;
      current = (current || 1) * 100;
    } else if (THOUSAND.has(word)) {
      // Spanish says "mil" for 1,000 on its own; English needs "one thousand".
      if (!read && word !== "mil") break;
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
    // "dólares" and "veintiún" read like "dolares" and "veintiun".
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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

    if (POINT.has(words[end])) {
      // "point two four" (digit by digit) or "punto veinticuatro" (one two-digit number).
      const digits: number[] = [];
      let j = end + 1;
      while (j < words.length && digits.length < 2 && words[j] in DIGIT_WORDS) {
        digits.push(DIGIT_WORDS[words[j]]);
        j += 1;
      }
      const asNumber = readWhole(words, end + 1);
      if (digits.length === 2 || (digits.length === 1 && (!asNumber || asNumber.value < 10))) {
        hundredths += digits.length === 1 ? digits[0] * 10 : digits[0] * 10 + digits[1];
        end = j;
      } else if (asNumber && asNumber.value < 100) {
        hundredths += asNumber.value;
        end = asNumber.end;
      }
    } else if (CURRENCY.has(words[end]) && JOINERS.has(words[end + 1])) {
      // "two hundred nine dollars and ninety three cents", "doscientos nueve dólares con noventa y tres centavos"
      const cents = readWhole(words, end + 2);
      if (cents && cents.value < 100 && CENTS.has(words[cents.end])) {
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
