/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser polyfills. These are applied before loading ZoneJS and are sorted by browsers.
 *   2. Application imports. Files imported after ZoneJS that should be loaded before your main
 *      file.
 *
 * The current setup is for so-called "evergreen" browsers; the last versions of browsers that
 * automatically update themselves. This includes Safari >= 10, Chrome >= 55 (including Opera),
 * Edge >= 13 on the desktop, and iOS 10 and Chrome on mobile.
 *
 * Learn more in https://angular.io/guide/browser-support
 */

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/** IE11 requires the following for NgClass support on SVG elements */
// import 'classlist.js';  // Run `npm install --save classlist.js`.

/**
 * Web Animations `@angular/platform-browser/animations`
 * Only required if AnimationBuilder is used within the application and using IE/Edge or Safari.
 * Standard animation support in Angular DOES NOT require any polyfills (as of Angular 6.0).
 */
// import 'web-animations-js';  // Run `npm install --save web-animations-js`.

/**
 * By default, zone.js will patch all possible macroTask and DomEvents
 * user can disable parts of macroTask/DomEvents patch by setting following flags
 * because those flags need to be set before `zone.js` being loaded, and webpack
 * will put import in the top of bundle, so user need to create a separate file
 * in this directory (for example: zone-flags.ts), and put the following flags
 * into that file, and then add the following code before importing zone.js.
 * import './zone-flags';
 *
 * The flags allowed in zone-flags.ts are listed here.
 *
 * The following flags will work for all browsers.
 *
 * (window as any).__Zone_disable_requestAnimationFrame = true; // disable patch requestAnimationFrame
 * (window as any).__Zone_disable_on_property = true; // disable patch onProperty such as onclick
 * (window as any).__zone_symbol__UNPATCHED_EVENTS = ['scroll', 'mousemove']; // disable patch specified eventNames
 *
 *  in IE/Edge developer tools, the addEventListener will also be wrapped by zone.js
 *  with the following flag, it will bypass `zone.js` patch for IE/Edge
 *
 *  (window as any).__Zone_enable_cross_context_check = true;
 *
 */



import './zone-flags';

/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
import 'zone.js/dist/zone';  // Included with Angular CLI.


/***************************************************************************************************
 * APPLICATION IMPORTS
 */
// Polyfill for Object.entries
if (!Object.entries) {
    Object.entries = function<T>(obj: { [key: string]: T }): [string, T][] {
      const entries: [string, T][] = [];
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          entries.push([key, obj[key]]);
        }
      }
      return entries;
    };
  }
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(search: string, pos?: number): boolean {
      pos = pos || 0;
      return this.substring(pos, pos + search.length) === search;
    };
  }
  // Polyfill for String.prototype.endsWith
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(search: string, thisLen?: number): boolean {
      if (thisLen === undefined || thisLen > this.length) {
        thisLen = this.length;
      }
      return this.substring(thisLen - search.length, thisLen) === search;
    };
  }

  if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function<T>(callback: (value: T, index: number, array: T[]) => boolean, thisArg?: any): number {
      if (this == null) {
        throw new TypeError('Array.prototype.findIndex called on null or undefined');
      }
      if (typeof callback !== 'function') {
        throw new TypeError('callback must be a function');
      }
      for (let i = 0; i < this.length; i++) {
        if (callback.call(thisArg, this[i], i, this)) {
          return i;
        }
      }
      return -1;
    };
  }

  // src/polyfills.ts

// Polyfill for Array.prototype.includes
if (!Array.prototype.includes) {
    Array.prototype.includes = function<T>(searchElement: T, fromIndex?: number): boolean {
      if (this == null) {
        throw new TypeError('Array.prototype.includes called on null or undefined');
      }
      const o = Object(this);
      const len = o.length >>> 0;
      if (len === 0) {
        return false;
      }
      const n = fromIndex || 0;
      let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
      while (k < len) {
        if (o[k] === searchElement) {
          return true;
        }
        k++;
      }
      return false;
    };
  }

  if (!String.prototype.includes) {
    String.prototype.includes = function(search: string, start?: number): boolean {
      if (typeof start !== 'number') {
        start = 0;
      }
      if (start + search.length > this.length) {
        return false;
      }
      return this.indexOf(search, start) !== -1;
    };
  }
