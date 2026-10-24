# Steps: a splat viewer

Goal: a full-window browser viewer for my own Gaussian splat scans, with levels of detail and VR.
Build one step at a time. The API details are in `ai/spark-facts.md`.

## Step 1: empty page
- `index.html` and `src/main.js`: a full-window three.js `WebGLRenderer` with `antialias: false`,
  a `PerspectiveCamera` and a `SparkRenderer` in the scene.
- Use `renderer.setAnimationLoop` as the render loop (VR needs it later). Inside it, draw only
  when something changed (Spark's `onDirty`, resize), not every frame.
- Handle window resizing.
- Set `window.__APP_READY__ = true` after the first frame. (Step 2 changes this.)
- Done when: `npm run check` is OK and the screenshot is an empty dark page.

## Step 2: the test splat
- Download `/splats/test.ply` with `fetch`. If the response is not ok, or its content-type is
  `text/html`, the file is missing.
- Make the splat with `new SplatMesh({ fileBytes, fileName })` and add it to the scene.
- It loads upside down: `splat.quaternion.set(1, 0, 0, 0)`.
- For now: camera at (0, 0.6, 4), looking at (0, 0, 0).
- Ready means drawn: set `window.__APP_READY__ = true` only when the splat is on screen:
  `spark.activeSplats > 0` and `spark.sorting` and `spark.sortDirty` are both false.
  Otherwise the check takes its screenshot of an empty page.
- Done when: the screenshot shows a rainbow sphere with a light ring, red on top, violet at the bottom.

## Step 3: errors and app checks
- If loading fails: show a clear message on the page and set `window.__APP_ERROR__` to it.
- `scripts/app-checks.mjs` (format at the top of `scripts/check.mjs`) with two checks:
  the canvas fills the window; the canvas is not blank (`measure('canvas').nonBackgroundRatio > 0.01`).
- Done when: `npm run check` is OK with 2/2 app checks.

## Step 4: camera
- `OrbitControls` with damping, from `three/addons/controls/OrbitControls.js`.
- Frame the camera from the splat: collect up to 20,000 splat centers with `forEachSplat`.
  On each axis keep only the middle 96% (the 2% at both ends are stray "floaters").
  Point the controls at the center of that box. Move the camera back until the box fills about
  70% of the window, seen from slightly above.
- The box maths: pure functions in `src/framing.js`, with tests in `tests/framing.test.js`.
- Done when: tests pass, check OK, the sphere fills most of the window, seen from slightly above.

## Step 5: your file
- `src/config.js` with `file: ''` (empty means the test splat), `flip: true`, `background: '#141414'`.
- `?file=` in the URL wins over `config.file`. Files live in `public/splats/`.
- A missing file, or a format other than .ply .spz .splat .ksplat .sog .rad: show a clear message
  and set `window.__APP_ERROR__` to it.
- File choice and format check: pure functions in `src/splat-file.js`, with tests.
- The F key flips the splat live.
- Done when: `npm run check` is OK; `npm run check "?file=missing.ply"` fails with
  "File not found"; `npm run check "?file=photo.jpg"` fails with "not a splat file".

## Step 6: open any file
- An "Open file" button at the top right, and drag and drop on the whole page.
- Read the file with `file.arrayBuffer()` and make the splat from the bytes, replacing the current one.
  Nothing is uploaded.
- If the file can't be read: keep the current splat and show the message.
- After every successful load: `window.__SPLAT__ = { file, splats }`.
- App check: open `public/splats/test.ply` with `page.setInputFiles` on the file input and wait
  for `window.__SPLAT__`.
- Done when: `npm run check` is OK with 3/3 app checks.

## Step 7: big scans
- Every splat that isn't a .rad file: create it with `lod: true`.
- .rad files from `public/splats/`: stream them with `new SplatMesh({ url, paged: true })`.
  A missing .rad must still show "File not found".
- Count splats and frame the camera from `mesh.packedSplats.lodSplats`, or `mesh.paged` for a
  stream. `mesh.splats` is empty with levels of detail.
- A stream starts empty: keep requesting renders until it has its first splats, then frame it,
  keeping the middle 80% instead of 96%.
- `detail: 1` in `src/config.js`, passed to `SparkRenderer` as `lodSplatScale`. `?detail=` in the URL wins.
- Done when: `npm run check` is OK, 3/3 app checks; `npm run check "?file=missing-lod.rad"` fails
  with "File not found".

## Step 8: VR
- Put the camera in a `THREE.Group` rig that is in the scene.
- An "Enter VR" button next to "Open file", with the CSS class `hidden`. `SparkXr` with that
  button as `element`, `mode: 'vr'`, `referenceSpaceType: 'local-floor'`.
- When VR starts: remember the desktop camera position and rotation. Then:
  - `size` = the largest side of the framing box from step 4; `scale = size / vrSize`
    (`vrSize: 1.5` in `src/config.js`), so the splat looks 1.5 metres large.
  - `rig.scale.setScalar(scale)`; rig position = camera position, then `rig.position.y -= 1.6 * scale`
    (1.6 m eye height, scaled too); rig rotation = only the camera's heading (rotation around Y).
  - Turn off the orbit controls; button text "Exit VR".
- When VR ends: put everything back.
- While in VR: render every frame and call `sparkXr.updateControllers(camera)`.
- App check: the VR button stays hidden in this browser.
- Done when: `npm run check` is OK with 4/4 app checks.
