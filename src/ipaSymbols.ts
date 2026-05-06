export type SymbolOption = {
  key: string;
  glyph: string;
  name: string;
  hint: string;
  modifiers?: SymbolOption[];
};

export const E_FAMILY: SymbolOption[] = [
  {
    key: "1",
    glyph: "e",
    name: "close-mid front unrounded vowel",
    hint: "plain latin e",
    modifiers: [
      { key: "1", glyph: "ẽ", name: "nasalized e", hint: "e + combining tilde" },
      { key: "2", glyph: "eː", name: "long e", hint: "e + length mark" },
    ],
  },
  {
    key: "2",
    glyph: "ɛ",
    name: "open-mid front unrounded vowel",
    hint: "epsilon",
    modifiers: [
      { key: "1", glyph: "ɛ̃", name: "nasalized epsilon", hint: "ɛ + combining tilde" },
      { key: "2", glyph: "ɛː", name: "long epsilon", hint: "ɛ + length mark" },
    ],
  },
  {
    key: "3",
    glyph: "ɜ",
    name: "open-mid central unrounded vowel",
    hint: "reversed epsilon",
    modifiers: [
      { key: "1", glyph: "ɜ̃", name: "nasalized reversed epsilon", hint: "ɜ + combining tilde" },
      { key: "2", glyph: "ɜː", name: "long reversed epsilon", hint: "ɜ + length mark" },
    ],
  },
  {
    key: "4",
    glyph: "ə",
    name: "mid central vowel",
    hint: "schwa",
    modifiers: [
      { key: "1", glyph: "ə̃", name: "nasalized schwa", hint: "ə + combining tilde" },
      { key: "2", glyph: "əː", name: "long schwa", hint: "ə + length mark" },
    ],
  },
  {
    key: "5",
    glyph: "ɘ",
    name: "close-mid central unrounded vowel",
    hint: "reversed e",
  },
  {
    key: "6",
    glyph: "ɚ",
    name: "r-colored mid central vowel",
    hint: "rhotic schwa",
  },
];
