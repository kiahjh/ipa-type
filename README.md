# IPA Type

Tiny Tauri + React feasibility spike for a Windows-first IPA typing palette.

## Current Spike

- `Ctrl+Shift+E` opens a compact `e`-family picker.
- The picker is keyboard-first: number keys insert, arrows move, `Enter` inserts, `Shift+Enter` opens modifiers, `Esc` hides.
- On Windows, Rust tries to position the picker near the active caret and insert Unicode into the previously focused app with `SendInput`.
- On macOS, the native Windows behavior is stubbed so the app can still build.

## Local Checks

```sh
npm install
npm run build
cd src-tauri && cargo check
```

To open the browser design preview with Vite HMR:

```sh
npm run design
```

Then open:

```text
http://127.0.0.1:1420/
```

To build the local macOS debug binary without bundling:

```sh
npm run tauri build -- --debug --no-bundle
```

To cross-compile a Windows 11 Arm64 test `.exe` from macOS:

```sh
cargo install cargo-xwin
rustup target add aarch64-pc-windows-msvc
npm run build:windows-arm64
```

The generated executable is:

```text
src-tauri/target/aarch64-pc-windows-msvc/release/ipa-type.exe
```

For convenience, copy it into the shared VM folder:

```sh
mkdir -p windows-builds
cp src-tauri/target/aarch64-pc-windows-msvc/release/ipa-type.exe windows-builds/ipa-type-spike-windows-arm64.exe
```

## Windows VM Test Path

Copy the Windows Arm64 `.exe` into the Windows VM. Open Notepad, click into the document, launch `ipa-type.exe`, press `Ctrl+Shift+E`, choose `ə`, and verify it inserts into Notepad.
