# IPA Type Windows Feasibility + Typing MVP Plan

## Summary

Build **IPA Type** as a Windows-first inline typing app, developed from macOS, with a **Tauri + Rust** architecture unless the Windows spike proves the native behavior is not good enough. The first milestone is a **Windows feasibility spike** in UTM: global shortcut, caret-adjacent floating palette, keyboard navigation, and Unicode insertion into real apps.

V1 should optimize for fast IPA typing, not teaching phonetics deeply: compact labels, curated visual families, search fallback, full official IPA coverage, no audio.

## Key Product Decisions

- Use **two entrances**:
  - Main palette shortcut for search-only discovery.
  - Direct family shortcuts such as `Ctrl+Shift+E` for curated symbol families.
- Use **curated families**, not automatic Unicode lookalikes. Example `e` family: `e`, `ɛ`, `ɜ`, `ə`, `ɘ`, `ɚ`, etc.
- Palette behavior:
  - Opens near the active insertion cursor without inserting the trigger letter.
  - `1-9`, arrows, and `Enter` select.
  - `Shift+Enter` opens modifiers for the highlighted symbol.
  - `Esc` closes and restores focus.
- Composition model:
  - Show friendly composed options like `ə̃`, `pʰ`, `t͡ʃ`.
  - Internally support insertable units as Unicode strings, not just single code points.
  - Keep raw diacritics available through search/modifier UI.
- V1 fallback for non-family symbols is **search only**, not a full chart UI.
- No pronunciation audio in v1.

## Implementation Shape

- Use Tauri for the app shell and Rust for Windows integration.
- Build a small native integration layer with these responsibilities:
  - Register configurable global shortcuts.
  - Locate caret bounds using Win32 first, with UI Automation/fallback strategies where needed.
  - Position a tiny always-on-top palette above or near the caret.
  - Restore focus to the original app after selection.
  - Insert Unicode via native input; fall back to clipboard paste if needed.
- Data model should include:
  - IPA symbol/string
  - Unicode code points
  - IPA name/description
  - Unicode name
  - category
  - search aliases
  - curated family membership
  - modifier/composition metadata
- Source the symbol inventory from official IPA/Unicode materials and include required attribution/licensing notes. Relevant references:
  - [IPA chart](https://www.internationalphoneticassociation.org/content/chart)
  - [IPA symbols and Unicode PDF](https://www.internationalphoneticassociation.org/sites/default/files/phonsymbol.pdf)
  - [Tauri global shortcuts](https://v2.tauri.app/plugin/global-shortcut/)
  - [Tauri window APIs](https://v2.tauri.app/reference/javascript/api/namespacewindow/)
  - [Windows caret positioning background](https://devblogs.microsoft.com/oldnewthing/20260107-00/?p=111971)
  - [Windows SendInput](https://learn.microsoft.com/en-gb/windows/win32/api/winuser/nf-winuser-sendinput?redirectedfrom=MSDN)

## Feasibility Spike

- Set up UTM with Windows 11 Arm for interactive testing.
- Add Windows CI build verification with GitHub Actions.
- Prototype only enough UI/data to prove the hard behavior:
  - Main shortcut opens a palette.
  - `Ctrl+Shift+E` opens the `e` family.
  - Palette appears near the caret.
  - Selecting `ə` or another test symbol inserts into the focused app.
  - `Shift+Enter` opens a small modifier submenu for the selected symbol.
- Test manually in a real Windows session against:
  - Notepad
  - Edge/Chrome text fields
  - Google Docs or another browser editor
  - VS Code
  - Windows Terminal
  - Word/Office if available
- Treat elevated/admin apps as an explicit known limitation unless later architecture changes.

## Typing MVP

After the spike succeeds, build the first real app:

- Full official IPA symbol/search dataset.
- Curated direct families for common visual anchors.
- Configurable shortcuts, with `Ctrl+Shift+letter` defaults.
- Recent symbols and favorites.
- Compact labels and metadata in the palette.
- Settings for shortcut conflicts and insertion fallback behavior.
- Basic onboarding that teaches the shortcut model without turning the app into a tutorial.

## Test Plan

- CI:
  - Windows build/package succeeds.
  - Unit tests validate symbol data, Unicode strings, search aliases, and family mappings.
- Manual Windows acceptance:
  - Palette opens reliably from common apps.
  - Palette position is close enough to the caret to feel attached.
  - Keyboard-only selection works.
  - Unicode output is correct for standalone symbols and composed sequences.
  - Focus returns to the original app after insertion.
  - Clipboard fallback, if used, does not leave surprising clipboard state.
- Pivot criterion:
  - If Tauri/Rust cannot deliver good caret positioning and insertion across the real-world app suite, revisit a deeper native Windows or IME/Text Services Framework architecture before building the full MVP.

## Assumptions

- "Every text field" means best-effort broad coverage across normal user-level apps, not a hard guarantee for elevated/admin apps or unusual custom editors.
- UTM is the chosen immediate Windows testing path.
- Search-only fallback is acceptable for v1; chart browsing can come later.
- Native behavior matters more than native-looking controls, so Tauri is acceptable if the Windows spike feels excellent.
