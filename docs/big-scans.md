# Big scans: levels of detail and .rad files

Photolipsia · ZHdK · MA Interaction Design · HS 2026

A scan from a phone app or a training tool easily has 1 to 10 million splats. Nobody can draw
all of them every frame, least of all a Quest. Spark solves this with **levels of detail (LoD)**:
it keeps a tree of the splats, where each parent is a softer merge of its children, and draws at
most a fixed number of them, fine close up and coarse far away.

| Device | Splats drawn at most |
|---|---|
| Quest (in the Quest browser) | 500,000 |
| Phone | 1 to 1.5 million |
| Laptop or desktop, also PC VR over Quest Link | 2.5 million |

The file can be much bigger than that. Only what you see gets drawn.

## What the viewer does by itself

- **`.ply`, `.spz`, `.splat`, `.ksplat`, `.sog`:** the viewer builds the levels of detail when the
  file loads (`lod: true` in `src/config.js`). That takes about 1 to 3 seconds per million splats.
- **`.rad`:** the file already contains the levels of detail. From `public/splats/` the viewer
  streams it: Spark only fetches the parts it needs, so a huge scan appears in seconds and gets
  sharper as the rest arrives. Opened from your disk, it loads as a whole.
- **More or less detail:** `detail` in `src/config.js`, or `?detail=` in the URL.
  `?detail=0.5` draws half as many splats (smoother on a Quest), `?detail=2` twice as many.

So for most scans you don't need to do anything. Convert to `.rad` when a scan is very large
(several million splats), when you show it on a Quest, or when it should load fast for others.

## Convert a scan to .rad

The converter is `build-lod`, a command-line tool in Spark's source code. It needs Rust, which
you install once. Building the converter also happens once (about 2 to 3 minutes).

Simplest for a class: the teacher converts everyone's scans on one machine.

### Once: install Rust and get the converter

**Mac**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
Answer the questions with the defaults, then open a new terminal.

**Windows**
```powershell
winget install --id Rustlang.Rustup -e
```
Rust on Windows also needs the Visual Studio C++ build tools. The installer offers them: accept.
Then open a new terminal.

**Both:** download Spark's source, the same version the viewer uses:
```bash
cd ~
git clone --depth 1 --branch v2.4.0 https://github.com/sparkjsdev/spark.git
```

### Every scan

**Mac**
```bash
cd ~/spark
npm run build-lod -- ~/Downloads/my-scan.ply
```

**Windows**
```powershell
cd $HOME\spark
npm run build-lod -- $HOME\Downloads\my-scan.ply
```

It writes `my-scan-lod.rad` next to the input file. Copy that into your project's
`public/splats/` and open it with `?file=my-scan-lod.rad`. You can pass several files at once.

Useful options (put them after the `--`, before the file names):

| Option | What it does |
|---|---|
| `--quick` | Faster conversion, slightly lower quality |
| `--max-sh=0` | Drops the view-dependent colour detail: much smaller files, a little flatter look |
| `--rad-chunked` | Writes a small `.rad` plus `.radc` chunk files, for very large scenes. Keep them in the same folder |

### Measured here

On the Linux laptop the kit was built on, with a generated 500,000-splat `.ply` (124 MB, full colour detail):

| Step | Time | Result |
|---|---|---|
| Build the converter (once) | 2 min 20 s | |
| Convert to `.rad` | 32 s | 30 MB, 4× smaller |
| Convert to chunked `.rad` | 19 s | 15 chunk files |
| Open the `.ply` in the viewer, LoD built in the browser | 1.1 s | |
| Open the `.rad` from disk | 0.8 s | |
| Stream the `.rad` from `public/splats/` | first view in seconds | fetched in pieces (`206` range requests) |

Not tested: the converter on Mac and Windows, and real scans from phone apps.

## Checking big files

`npm run check` draws in software, without a graphics card. That is fine for the small test
splat, but too slow for a streamed multi-million-splat scan: the check times out. Look at big files
in the browser instead, with `npm run dev` and `?file=my-scan-lod.rad`.
