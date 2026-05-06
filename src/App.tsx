import { useCallback, useEffect, useState } from "react";
import { PickerStrip } from "./PickerStrip";
import { usePickerState } from "./usePickerState";
import "./App.css";

type PaletteOpenedPayload = {
  placement: "above" | "below";
  palette_x: number;
  palette_y: number;
  caret_x: number;
  caret_y: number;
  caret_height: number;
};

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

async function invokeTauri(command: string, args?: Record<string, unknown>) {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke(command, args);
}

function TauriPalette() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [placement, setPlacement] = useState<PaletteOpenedPayload>({
    placement: "above",
    palette_x: 12,
    palette_y: 12,
    caret_x: 32,
    caret_y: 84,
    caret_height: 30,
  });
  const hidePalette = useCallback(() => {
    setPaletteOpen(false);
    void invokeTauri("hide_palette");
  }, []);

  const insertSymbol = useCallback((text: string) => {
    setPaletteOpen(false);
    void invokeTauri("insert_symbol", { text });
  }, []);

  const picker = usePickerState({
    onCancel: hidePalette,
    onSelect: insertSymbol,
  });

  useEffect(() => {
    let disposed = false;
    let cleanupPrepare: (() => void) | undefined;
    let cleanupOpened: (() => void) | undefined;
    let cleanupClosing: (() => void) | undefined;

    void import("@tauri-apps/api/event").then(({ listen }) => {
      void listen<PaletteOpenedPayload>("palette-prepare", (event) => {
        picker.reset();
        setPlacement(event.payload);
        setPaletteOpen(false);
      }).then((unlisten) => {
        if (disposed) {
          unlisten();
        } else {
          cleanupPrepare = unlisten;
        }
      });

      void listen<PaletteOpenedPayload>("palette-opened", (event) => {
        setPlacement(event.payload);
        setPaletteOpen(true);
      }).then((unlisten) => {
        if (disposed) {
          unlisten();
        } else {
          cleanupOpened = unlisten;
        }
      });

      void listen("palette-closing", () => {
        setPaletteOpen(false);
      }).then((unlisten) => {
        if (disposed) {
          unlisten();
        } else {
          cleanupClosing = unlisten;
        }
      });
    });

    return () => {
      disposed = true;
      cleanupPrepare?.();
      cleanupOpened?.();
      cleanupClosing?.();
    };
  }, []);

  return (
    <PickerStrip
      activeIndex={picker.activeIndex}
      caretHeight={placement.caret_height}
      caretX={placement.caret_x}
      caretY={placement.caret_y}
      onHover={picker.hover}
      onSelect={picker.select}
      open={paletteOpen}
      options={picker.options}
      modifierOpen={picker.modifierOpen}
      paletteX={placement.palette_x}
      paletteY={placement.palette_y}
      parentOption={picker.parentOption}
      onDismiss={hidePalette}
    />
  );
}

function BrowserPreview() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selected, setSelected] = useState("ə");
  const noop = useCallback(() => undefined, []);
  const picker = usePickerState({
    onCancel: noop,
    onSelect: setSelected,
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => setPreviewOpen(true), 80);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <main className="preview-shell">
      <section className="preview-stage">
        <div className="preview-text-line">
          <span>transcription </span>
          <span className="preview-caret" />
          <span className="preview-selection">{selected}</span>
        </div>
        <div className="preview-popover">
          <PickerStrip
            activeIndex={picker.activeIndex}
            caretHeight={30}
            caretX={124}
            caretY={68}
            onHover={picker.hover}
            onSelect={picker.select}
            open={previewOpen}
            options={picker.options}
            modifierOpen={picker.modifierOpen}
            paletteX={12}
            paletteY={12}
            parentOption={picker.parentOption}
          />
        </div>
      </section>
    </main>
  );
}

function App() {
  return isTauriRuntime() ? <TauriPalette /> : <BrowserPreview />;
}

export default App;
