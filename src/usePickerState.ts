import { useEffect, useState } from "react";
import { E_FAMILY, type SymbolOption } from "./ipaSymbols";

type UsePickerStateOptions = {
  onCancel: () => void;
  onSelect: (text: string) => void;
};

export function usePickerState({ onCancel, onSelect }: UsePickerStateOptions) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [modifierIndex, setModifierIndex] = useState(0);
  const [modifierOpen, setModifierOpen] = useState(false);
  const activeOption = E_FAMILY[activeIndex];
  const modifierOptions = activeOption.modifiers ?? [];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const currentOptions = modifierOpen ? modifierOptions : E_FAMILY;
      const currentIndex = modifierOpen ? modifierIndex : activeIndex;
      const setCurrentIndex = modifierOpen ? setModifierIndex : setActiveIndex;

      if (event.key === "Escape") {
        event.preventDefault();
        if (modifierOpen) {
          setModifierOpen(false);
          return;
        }
        onCancel();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrentIndex((index) => (index + 1) % currentOptions.length);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrentIndex((index) => (index - 1 + currentOptions.length) % currentOptions.length);
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        setCurrentIndex((index) => (index + 1) % currentOptions.length);
        return;
      }

      if (/^[1-9]$/.test(event.key)) {
        const match = currentOptions.find((option) => option.key === event.key);
        if (match) {
          event.preventDefault();
          select(match);
        }
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();

        if (event.shiftKey && !modifierOpen && modifierOptions.length > 0) {
          setModifierIndex(0);
          setModifierOpen(true);
          return;
        }

        const selected = currentOptions[Math.min(currentIndex, currentOptions.length - 1)];
        select(selected);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, modifierIndex, modifierOpen, modifierOptions, onCancel, onSelect]);

  function reset() {
    setActiveIndex(0);
    setModifierIndex(0);
    setModifierOpen(false);
  }

  function hover(index: number) {
    if (modifierOpen) {
      setModifierIndex(index);
    } else {
      setActiveIndex(index);
      setModifierIndex(0);
      setModifierOpen(false);
    }
  }

  function select(option: SymbolOption) {
    onSelect(option.glyph);
    setModifierIndex(0);
    setModifierOpen(false);
  }

  return {
    activeIndex: modifierOpen ? modifierIndex : activeIndex,
    modifierOpen,
    parentOption: activeOption,
    hover,
    options: modifierOpen ? modifierOptions : E_FAMILY,
    reset,
    select,
  };
}
