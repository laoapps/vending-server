---
name: cui-prodota
description: Use this skill when working in the CUI-ProdOTA Ionic/Angular vending-machine project, including vending UI flows, LAAB/MMoney/LaoQR payments, SmartCB, HM store vending, Capacitor Android builds, live updates, serial hardware integrations, offline storage, and local project validation.
---

# CUI-ProdOTA Project Skill

## Project Shape

This repository is an Ionic Angular application for LaoApps vending-machine clients. It targets browser builds under `www` and Capacitor Android/iOS shells, with Android present in `android/`.

Core stack:

- Angular 15, Ionic 7, TypeScript 4.8, RxJS 7.
- Capacitor 7 plugins for app lifecycle, device, filesystem, SQLite, preferences, toast, live update, barcode scanning, and serial hardware.
- Local persistence through Ionic Storage, IndexedDB/Dexie-like services, Capacitor SQLite, and browser `localStorage`.
- HTTP calls through Angular `HttpClient` and `axios`.
- WebSocket machine control through `src/app/services/wsapi.service.ts`.

High-risk domains:

- Payment, sale confirmation, bill acceptance, QR generation, and cashout/cashin flows.
- Serial device control for VMC/ZDM8/TP77/ESSP/cctalk/MT102/ADH814/ADH815.
- Offline sale/error persistence and replay.
- Capacitor live update and production environment URLs.

## Important Paths

- `src/app/app-routing.module.ts`: root route registration. Some page modules are eagerly imported and returned directly from `loadChildren`; keep the existing style unless doing a deliberate routing cleanup.
- `src/app/app.module.ts`: root Angular module, global error handler, HTTP interceptor, Ionic storage setup, shared modal declarations.
- `src/app/app.component.ts`: startup flow, live update sync/ready handling, online status timer, hidden setting modal entry, close-system modal.
- `src/app/tab1/tab1.page.*`: primary kiosk/vending landing workflow and most machine UI state.
- `src/app/tab1/Vending/**`: vending purchase, cart, paid order, phone payment, how-to, game, and auto-payment pages.
- `src/app/tab1/LAAB/**`: LAAB cashin/cashout/EPIN/SMC pages.
- `src/app/tab1/LAAB_processes/**`: LAAB process classes for validations, EPIN/SMC creation, balance loading, and user info.
- `src/app/tab1/MMoney_processes/**`: MMoney QR generation.
- `src/app/tab1/LaoQR_processes/**`: LaoQR QR-code generation.
- `src/app/tab1/Vending_processes/loadStockList.process.ts`: stock loading used by vending UI.
- `src/app/services/**`: shared app services for API, WebSocket, caching, storage, serial, Excel export, menu control, vending APIs, and local DB.
- `src/app/services/syste.model.ts`: shared vending, WebSocket, serial, machine, bill, stock, and payment interfaces/enums. Check this before introducing new model shapes.
- `src/app/smartcb/app/**`: SmartCB sub-application with auth, owner/user/admin pages, services, and its own module/routing.
- `src/app/hm-store-vending/app/**`: HM Store Vending sub-application with home, detail-product, cart QR, and its own services/module/routing.
- `src/assets/**`: production assets including payment logos, Lao voice prompts, vending icons, ads, how-to videos, scratch/game images, and sounds.
- `src/environments/environment.ts` and `src/environments/environment.prod.ts`: API/WebSocket URL selection and `versionId`.
- `capacitor.config.ts`: app id/name, `www` webDir, LiveUpdate config, SQLite config, Android mixed-content behavior.
- `angular.json`: build/test targets, assets, styles, production file replacement.

## Runtime Architecture

The main kiosk route is `/tabs/tab1`. `Tab1Page` owns much of the vending state: selected hardware device, serial configuration, machine status, menu segments, online/offline mode, payment selection, local stock/sale lists, music/voice settings, and modal page references.

`ApiService` is the central shared service. It holds machine identity, current payment provider, bill/sale state, WebSocket status, stock lists, local balance, audio prompts, menu/page references, and API endpoint defaults. Before changing vending behavior, inspect the relevant methods in `ApiService` and the process class/page that calls them.

`WsapiService` owns WebSocket connection lifecycle:

- Connects with machine id and OTP.
- Sends login and periodic ping commands.
- Publishes status through `BehaviorSubject`s for connection, login, alive, bill process, balance updates, refresh, waiting delivery, and alerts.
- Reconnects with backoff and logs failures through `IndexerrorService`.

Serial and hardware services live mostly at `src/app/*.service.ts` plus `src/app/services/serialservice.service.ts`. The project supports multiple device protocols, so changes must preserve the selected `localStorage` device mode and existing defaults such as `portName`, `baudRate`, and `NV9USB`.

## Payment And Machine Flows

Payment-related work should trace both the UI page and its process helper:

- LAAB: pages under `src/app/tab1/LAAB/**`, process classes under `src/app/tab1/LAAB_processes/**`.
- MMoney: `src/app/tab1/MMoney/**` and `src/app/tab1/MMoney_processes/generateMMoneyQRCode.process.ts`.
- LaoQR: `src/app/tab1/LaoQR_processes/generateLaoQRCode.process.ts`.
- Vending sale/cart/payment: `src/app/tab1/Vending/**` and `src/app/tab1/Vending_processes/loadStockList.process.ts`.
- QR payment modal/page: `src/app/qrpay/**`.
- Payment method selection: `src/app/paymentmethod/**`.

For these areas, do not change API payload keys, token generation, transaction id handling, bill-process transitions, or local persistence formats without checking all callers with `rg`.

## Development Commands

Use the existing npm scripts:

```bash
npm start
npm run build
npm test
npm run bu
npm run build:es5
```

Notes:

- `npm start` runs `ng serve`.
- `npm run build` runs `ng build`.
- `npm test` runs Karma.
- `npm run bu` runs `ionic build --prod && npx cap sync`.
- `build.sh` runs `ionic build --prod`, then `docker-compose down` and `docker-compose up -d`.
- `npm run lint` exists, but `angular.json` references `@angular-eslint/builder:lint` while the package has older ESLint tooling. If lint fails due to builder/config mismatch, report that instead of masking it.

When validating UI-only changes, prefer `npm run build` first. For native/live-update changes, use the Ionic/Capacitor command relevant to the requested target.

## Code Patterns

- Follow the existing Ionic page module pattern: `*.page.ts`, `*.page.html`, `*.page.scss`, `*.module.ts`, and `*-routing.module.ts`.
- Services are generally `providedIn: 'root'` and use mutable public state heavily. Keep changes narrow and avoid sweeping state refactors.
- Existing code mixes `HttpClient`, `axios`, `EventEmitter`, `BehaviorSubject`, `localStorage`, and async/await. Match the local caller pattern for the file being edited.
- Many routes use direct imported modules in `loadChildren`. Do not convert the whole route tree to dynamic imports unless asked.
- The project has strict Angular template checks enabled. Keep template bindings compatible with declared component fields and methods.
- Use existing enum/interface definitions from `src/app/services/syste.model.ts` and `src/app/models/base.model.ts`.
- Keep asset paths relative to the built app, usually `assets/...`.
- Preserve user-facing Lao text, payment labels, sound file names, and image names exactly unless the task is a copy/content change.

## Storage And Offline Behavior

Before modifying persistence or offline sale flows, inspect:

- `src/app/services/ionicstorage.service.ts`
- `src/app/ionic-storage.service.ts`
- `src/app/services/indededdb.service.ts`
- `src/app/services/indexdblocal.service.ts`
- `src/app/indexerror.service.ts`
- `src/app/indexsavesale.ts`
- `src/app/database.service.ts`
- `src/app/blockchain-db.ts`

Be careful with `localStorage` keys because they control runtime behavior, device selection, URLs, mute settings, QR mode, balance, and menu state.

## Environment And Build Notes

`environment.ts` chooses between LTC and HM endpoints based on `localStorage.getItem('isLTC')`. It also defines explicit LTC/HM URLs and SmartCB API URL. `environment.prod.ts` is swapped by Angular production builds.

Capacitor uses:

- `appId`: `com.laoapps.vendingmachine`
- `appName`: `cui3`
- `webDir`: `www`
- LiveUpdate default channel: `production`
- SQLite database location/encryption settings

Do not change production endpoints, live-update app id, or app id/name as incidental cleanup.

## Validation Checklist

For most code changes:

1. Run `npm run build`.
2. If tests are relevant and not too costly, run `npm test -- --watch=false` or the closest supported Karma command.
3. For payment, hardware, WebSocket, or offline changes, search call sites with `rg` and describe any untested hardware-dependent behavior.
4. For route/page additions, verify the page module is registered in the correct routing module and the component appears in the right module declarations.
5. For asset changes, verify the path is under an Angular asset input, normally `src/assets`.

## Search Hints

Useful commands:

```bash
rg "class ApiService|class WsapiService|BehaviorSubject|EventEmitter" src/app
rg "localStorage.getItem|localStorage.setItem" src/app
rg "EPaymentProvider|EMACHINE_COMMAND|EClientCommand|EMessage" src/app
rg "showModal|ModalController|present\\(" src/app
rg "transactionID|billProcess|waitingDelivery|balanceUpdate" src/app
rg "environment\\.|versionId|LiveUpdate" src/app capacitor.config.ts
```

When changing a page flow, start with the page component, then inspect its HTML/SCSS/module/routing files and any imported process/service classes.

## Safety Rules

- Treat vending/payment/hardware code as stateful production code. Prefer minimal, traceable edits.
- Do not remove existing assets or generated native files unless explicitly asked.
- Do not reset or rewrite `package-lock.json`, Android project files, `www`, or build outputs unless the task requires it.
- Do not assume hardware behavior can be proven by browser tests. Call out hardware validation gaps clearly.
- Preserve existing API names, model keys, and local storage keys unless all producers and consumers are updated together.
