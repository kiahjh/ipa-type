import { useEffect, useRef, type CSSProperties } from "react";
import { LazyMotion, domAnimation, motion } from "motion/react";
import { E_FAMILY, type SymbolOption } from "./ipaSymbols";

type PickerStripProps = {
  activeIndex: number;
  caretHeight?: number;
  caretX?: number;
  caretY?: number;
  onDismiss?: () => void;
  onHover: (index: number) => void;
  onSelect: (option: SymbolOption) => void;
  open?: boolean;
  options: SymbolOption[];
  modifierOpen?: boolean;
  paletteX?: number;
  paletteY?: number;
  parentOption?: SymbolOption;
};

const KEY_WIDTH = 36;
const DIVIDER_X = 40;
const MODIFIER_START_X = 46;
const ROW_X_PADDING = 8;
const PALETTE_BORDER_WIDTH = 2;
const WINDOW_WIDTH = 250;
const SHADOW_GUTTER = 12;

export function PickerStrip({
  activeIndex,
  caretHeight = 30,
  caretX = 32,
  caretY = 84,
  onDismiss,
  onHover,
  onSelect,
  open = true,
  modifierOpen = false,
  paletteX = 12,
  paletteY = 12,
  parentOption,
}: PickerStripProps) {
  const wasOpen = useRef(open);
  const summoning = open && !wasOpen.current && !modifierOpen;
  const highlightX = modifierOpen ? MODIFIER_START_X + activeIndex * KEY_WIDTH : activeIndex * KEY_WIDTH;
  const modifierOptions = parentOption?.modifiers ?? [];
  const rowContentWidth = modifierOpen
    ? MODIFIER_START_X + modifierOptions.length * KEY_WIDTH
    : E_FAMILY.length * KEY_WIDTH;
  const rowWidth = ROW_X_PADDING + rowContentWidth;
  const paletteWidth = rowWidth + PALETTE_BORDER_WIDTH;
  const paletteLeft = clamp(caretX - paletteWidth / 2, SHADOW_GUTTER, WINDOW_WIDTH - SHADOW_GUTTER - paletteWidth);
  const widthTransition = { type: "spring" as const, stiffness: 720, damping: 42, mass: 0.34 };
  const positionStyle = {
    "--caret-height": `${caretHeight}px`,
    "--caret-x": `${caretX}px`,
    "--caret-y": `${caretY}px`,
    "--palette-x": `${paletteX}px`,
    "--palette-y": `${paletteY}px`,
  } as CSSProperties;

  useEffect(() => {
    wasOpen.current = open;
  }, [open]);

  return (
    <main
      className="palette-window"
      aria-label="IPA Type e family picker"
      style={positionStyle}
      onPointerDown={(event) => {
        const target = event.target as HTMLElement;
        if (!target.closest("button")) {
          onDismiss?.();
        }
      }}
    >
      <LazyMotion features={domAnimation}>
        <span aria-hidden="true" className="source-caret" />
        <motion.section
          animate={
            open
              ? { left: paletteLeft, opacity: 1, scaleX: 1, width: paletteWidth }
              : { left: paletteLeft, opacity: 0, scaleX: 0.02, width: paletteWidth }
          }
          style={{ left: paletteLeft, width: paletteWidth }}
          className="palette"
          aria-label="e-like IPA symbols"
          initial={{ opacity: 0, scaleX: 0.02 }}
          transition={{
            opacity: { duration: 0.1, ease: "easeOut" },
            scaleX: { type: "spring", stiffness: 600, damping: 34, mass: 0.52 },
            left: widthTransition,
            width: widthTransition,
          }}
        >
          <motion.div
            animate={{ width: rowWidth }}
            className={modifierOpen ? "symbol-row symbol-row--modifier" : "symbol-row"}
            initial={false}
            transition={{ width: widthTransition }}
          >
            <motion.div
              aria-hidden="true"
              className="symbol-highlight"
              animate={{
                opacity: open ? 1 : 0,
                x: highlightX,
              }}
              initial={false}
              transition={{
                opacity: {
                  delay: summoning ? 0.08 : 0,
                  duration: 0.08,
                  ease: "easeOut",
                },
                x: { type: "spring", stiffness: 1200, damping: 50, mass: 0.28 },
              }}
            />

            {E_FAMILY.map((option, index) => {
              const isParent = modifierOpen && parentOption?.glyph === option.glyph;
              const isHiddenSibling = modifierOpen && !isParent;
              const summonDelay = summoning ? 0.11 + index * 0.025 : 0;

              return (
                <motion.button
                  animate={{
                    opacity: open && !isHiddenSibling ? 1 : 0,
                    scale: open && !isHiddenSibling ? 1 : 0.68,
                    x: isParent ? 0 : index * KEY_WIDTH,
                    y: open && !isHiddenSibling ? 0 : 5,
                  }}
                  aria-hidden={isHiddenSibling}
                  aria-label={`${option.glyph}, ${option.name}`}
                  className={isParent ? "symbol-key symbol-key--parent" : "symbol-key"}
                  initial={{
                    opacity: 0,
                    scale: 0.68,
                    x: index * KEY_WIDTH,
                    y: 5,
                  }}
                  key={`base-${option.glyph}`}
                  style={{ pointerEvents: isHiddenSibling ? "none" : "auto" }}
                  tabIndex={isHiddenSibling ? -1 : 0}
                  title={`${option.glyph} - ${option.name}`}
                  transition={{
                    opacity: { delay: summonDelay, duration: modifierOpen ? 0.08 : 0.11, ease: "easeOut" },
                    scale: {
                      delay: summonDelay,
                      type: "spring",
                      stiffness: summoning ? 1180 : 760,
                      damping: summoning ? 24 : 30,
                      mass: 0.22,
                    },
                    x: { type: "spring", stiffness: 760, damping: 35, mass: 0.34 },
                    y: {
                      delay: summonDelay,
                      type: "spring",
                      stiffness: summoning ? 1180 : 760,
                      damping: summoning ? 26 : 32,
                      mass: 0.22,
                    },
                  }}
                  type="button"
                  onClick={() => onSelect(option)}
                  onMouseEnter={() => {
                    if (!modifierOpen) {
                      onHover(index);
                    }
                  }}
                >
                  <span className="symbol-key__glyph">{option.glyph}</span>
                  {!isParent ? (
                    <span aria-hidden="true" className="symbol-key__hint">
                      {option.key}
                    </span>
                  ) : null}
                </motion.button>
              );
            })}

            <motion.div
              animate={{
                opacity: modifierOpen && open ? 1 : 0,
                scaleY: modifierOpen && open ? 1 : 0.7,
                x: DIVIDER_X,
              }}
              aria-hidden="true"
              className="symbol-divider"
              initial={false}
              transition={{
                opacity: { duration: 0.09, ease: "easeOut" },
                scaleY: { duration: 0.12, ease: "easeOut" },
              }}
            />

            {modifierOptions.map((option, index) => (
              <motion.button
                animate={{
                  opacity: open && modifierOpen ? 1 : 0,
                  scale: open && modifierOpen ? 1 : 0.94,
                  x: MODIFIER_START_X + index * KEY_WIDTH,
                  y: 0,
                }}
                aria-hidden={!modifierOpen}
                aria-label={`${option.glyph}, ${option.name}`}
                className="symbol-key symbol-key--modifier"
                initial={false}
                key={`modifier-${option.glyph}`}
                style={{ pointerEvents: modifierOpen ? "auto" : "none" }}
                tabIndex={modifierOpen ? 0 : -1}
                title={`${option.glyph} - ${option.name}`}
                transition={{
                  opacity: {
                    delay: modifierOpen ? 0.015 + index * 0.012 : 0,
                    duration: 0.1,
                    ease: "easeOut",
                  },
                  scale: {
                    delay: modifierOpen ? 0.015 + index * 0.012 : 0,
                    type: "spring",
                    stiffness: 920,
                    damping: 31,
                    mass: 0.26,
                  },
                  x: { type: "spring", stiffness: 760, damping: 35, mass: 0.34 },
                }}
                type="button"
                onClick={() => onSelect(option)}
                onMouseEnter={() => onHover(index)}
              >
                <span className="symbol-key__glyph">{option.glyph}</span>
                <span aria-hidden="true" className="symbol-key__hint">
                  {option.key}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </motion.section>
      </LazyMotion>
    </main>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}
