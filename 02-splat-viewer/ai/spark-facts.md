# Spark facts

For `@sparkjsdev/spark` 2.4.0 with `three` 0.186.1. Trust this over what you remember:
older Spark versions worked differently.

- `import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark'`
- Spark 2 needs a `SparkRenderer` in the scene, or nothing is drawn:
  `const spark = new SparkRenderer({ renderer, onDirty }); scene.add(spark);`
- Create the `WebGLRenderer` with `{ antialias: false }`.
- Render only when something changed: Spark's `onDirty`, the controls' `change` event, resize.
  A loop that draws every frame makes `npm run check` take 10 seconds or more.
- `const splat = new SplatMesh({ url }); await splat.initialized;`
  It rejects when loading fails, sometimes with a plain string instead of an `Error`.
- Vite answers a missing file in `public/` with `index.html` and status 200. Fetch the file
  yourself with GET, check the status and the content type, then pass the bytes:
  `new SplatMesh({ fileBytes, fileName })`.
- Formats: `.ply` `.spz` `.splat` `.ksplat` `.sog` `.rad`
- `splat.quaternion.set(1, 0, 0, 0)` flips a capture that loads upside down. The test splat needs it.
- `splat.getBoundingBox()` returns a `THREE.Box3` once `initialized` has resolved.
  `THREE.Box3.setFromObject(splat)` does not work for splats.
- Sorting runs in a worker, so the first frames after loading can be empty. The splats are on
  screen when `spark.activeSplats > 0` and `spark.sorting` and `spark.sortDirty` are both false.
- OrbitControls: `import { OrbitControls } from 'three/addons/controls/OrbitControls.js'`
- `npm run check` records `console.warn` and `console.error`, and `console.log` under `logs`.

## VR (WebXR)

- `new SparkXr({ renderer, element, mode: 'vr', referenceSpaceType: 'local-floor', controllers: {}, onEnterXr, onExitXr })`
  (from `@sparkjsdev/spark`) shows `element` only when the browser can do VR, and starts or
  ends VR when it is clicked. Give the element the CSS class `hidden` at first: SparkXr removes it.
- Put the camera in a `THREE.Group` (a rig). In VR the headset moves the camera inside the rig:
  move, turn or scale the rig to place the viewer. `sparkXr.updateControllers(camera)` moves the
  rig with the Quest sticks. Call it every frame in VR.
- While `renderer.xr.isPresenting` is true, render every frame: the head never stops moving.
  VR only works if the render loop is `renderer.setAnimationLoop(...)`. SparkXr turns on
  `renderer.xr.enabled` by itself.
- WebXR needs https, or localhost. `npm run dev:vr` serves https on your network for the Quest browser.

## Levels of detail (big scans)

- `new SplatMesh({ fileBytes, fileName, lod: true })` builds levels of detail in a background
  worker (about 1 to 3 s per million splats). Spark then draws at most a fixed budget of splats:
  500K in the Quest browser, 2.5M on a desktop. `new SparkRenderer({ renderer, lodSplatScale })`
  scales that budget (2 = twice as many).
- After the LoD build the splats live in `mesh.packedSplats.lodSplats`; `mesh.splats` is empty.
- Where to read splats from: `mesh.splats` without LoD, `mesh.packedSplats.lodSplats` with LoD,
  `mesh.paged` for a stream. Each has `getNumSplats()` and
  `forEachSplat((index, center, scales, quaternion, opacity, color) => …)`; `center` is a `THREE.Vector3`.
- `.rad` files already contain levels of detail. `new SplatMesh({ url, paged: true })` streams one
  from the server with HTTP range requests. Its pager is `mesh.paged`, which has no splats until
  the first pages arrive, and Spark only fetches pages while it draws: keep requesting renders
  until `mesh.paged.getNumSplats() > 0`, then frame the camera.
- A streamed file keeps sorting while pages arrive: don't wait for `spark.sortDirty` to be false.
