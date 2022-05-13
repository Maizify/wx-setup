/**
 * A simplified version of Vue3's `apiWatch.ts`.
 */

import { isRef, isReactive, isShallow, ReactiveEffect, DebuggerOptions } from '@vue/reactivity';
import { hasChanged, isArray, isObject, isPlainObject, isSet, isMap, EMPTY_OBJECT } from './utils';
import type { Ref, ComputedRef, EffectScheduler } from '@vue/reactivity';

export type IWatchEffect = (onCleanup: IOnCleanup) => void;
export type IWatchSource<T = any> = Ref<T> | ComputedRef<T> | (() => T);
export type IWatchStopHandle = () => void;
export type IWatchCallback<V = any, OV = any> = (
  value: V,
  oldValue: OV,
  onCleanup: IOnCleanup,
) => any;

export interface IWatchOptionsBase extends DebuggerOptions {
  flush?: 'pre' | 'post' | 'sync'; // Vue3 version
}
export interface IWatchOptions<Immediate = boolean> extends IWatchOptionsBase {
  immediate?: Immediate;
  deep?: boolean;
}

type IOnCleanup = (cleanupFn: () => void) => void;
type IMultiIWatchSources = (IWatchSource<unknown> | object)[];
type IMapSources<T, Immediate> = {
  [K in keyof T]: T[K] extends IWatchSource<infer V>
    ? Immediate extends true
      ? V | undefined
      : V
    : T[K] extends object
    ? Immediate extends true
      ? T[K] | undefined
      : T[K]
    : never
}

const enum ReactiveFlags {
  SKIP = '__v_skip',
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  IS_SHALLOW = '__v_isShallow',
  RAW = '__v_raw',
}

const INITIAL_WATCHER_VALUE = EMPTY_OBJECT;

export function watchEffect(
  effect: IWatchEffect,
  options?: IWatchOptionsBase
): IWatchStopHandle {
  return doWatch(effect, null, options);
}

export function watchSyncEffect(
  effect: IWatchEffect,
  options?: DebuggerOptions
) {
  return doWatch(effect, null, { flush: 'sync' });
}

// overload: array of multiple sources + cb
export function watch<
  T extends IMultiIWatchSources,
  Immediate extends Readonly<boolean> = false
>(
  sources: [...T],
  cb: IWatchCallback<IMapSources<T, false>, IMapSources<T, Immediate>>,
  options?: IWatchOptions<Immediate>
): IWatchStopHandle;

// overload: multiple sources w/ `as const`
// watch([foo, bar] as const, () => {})
// somehow [...T] breaks when the type is readonly
export function watch<
  T extends Readonly<IMultiIWatchSources>,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: IWatchCallback<IMapSources<T, false>, IMapSources<T, Immediate>>,
  options?: IWatchOptions<Immediate>
): IWatchStopHandle;

// overload: single source + cb
export function watch<T, Immediate extends Readonly<boolean> = false>(
  source: IWatchSource<T>,
  cb: IWatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: IWatchOptions<Immediate>
): IWatchStopHandle;

// overload: watching reactive object w/ cb
export function watch<
  T extends object,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: IWatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: IWatchOptions<Immediate>
): IWatchStopHandle;

// implementation
export function watch<T = any, Immediate extends Readonly<boolean> = false>(
  source: T | IWatchSource<T>,
  cb: any,
  options?: IWatchOptions<Immediate>
): IWatchStopHandle {
  return doWatch(source as any, cb, options);
}

function doWatch(
  source: IWatchSource | IWatchSource[] | IWatchEffect | object, 
  cb: IWatchCallback | null, 
  { immediate, deep, flush, onTrack, onTrigger }: IWatchOptions = {}
) {
  // 1. create a getter: () => reactive data
  const instance = undefined; // TODO
  let getter: () => any;
  let forceTrigger = false;
  let isMultiSource = false;

  if (isRef(source)) {
    getter = () => source.value;
    forceTrigger = isShallow(source);
  } else if (isReactive(source)) {
    getter = () => source;
    deep = true;
  } else if (isArray(source)) {
    isMultiSource = true;
    forceTrigger = source.some(isReactive);
    getter = () => {
      source.map((s) => {
        if (isRef(s)) {
          return s.value;
        } else if (isReactive(s)) {
          return traverse(s);
        } else if (typeof s === 'function') {
          return s.apply(instance);
        } else {
          throw new Error(`Watch: Invalid data type "${typeof s}"`);
        }
      });
    };
  } else if (typeof source === 'function') {
    // throw new Error(`Watch: Invalid data type "${typeof source}"`);
    if (cb) {
      // getter with cb
      getter = () => {
        return source.apply(instance);
      };
    } else {
      // no cb -> simple effect
      getter = () => {
        if (instance && instance.isUnmounted) {
          return
        }
        if (cleanup) {
          cleanup()
        }
        return source.apply(instance);
      };
    }
  } else {
    getter = () => void 0;
  }

  if (cb && deep) {
    const baseGetter = getter;
    getter = () => traverse(baseGetter());
  }

  let cleanup: () => void
  let onCleanup: IOnCleanup = (fn: () => void) => {
    cleanup = effect.onStop = () => {
      fn.apply(instance);
    };
  };

  let oldValue = isMultiSource ? [] : INITIAL_WATCHER_VALUE;
  const job = () => {
    if (!effect.active) {
      return;
    }
    if (cb) {
      // watch(source, cb)
      const newValue = effect.run();
      if (
        deep ||
        forceTrigger ||
        (isMultiSource
          ? (newValue as any[]).some((v, i) =>
              hasChanged(v, (oldValue as any[])[i])
            )
          : hasChanged(newValue, oldValue))
      ) {
        // cleanup before running cb again
        if (cleanup) {
          cleanup();
        }
        cb.apply(instance, [
          newValue,
          // pass undefined as the old value when it's changed for the first time
          oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
          onCleanup
        ]);
        oldValue = newValue;
      }
    } else {
      // watchEffect
      effect.run();
    }
  }

  // important: mark the job as a watcher callback so that scheduler knows
  // it is allowed to self-trigger
  job.allowRecurse = !!cb;

  let scheduler: EffectScheduler;
  if (flush === 'sync') {
    scheduler = job as any; // the scheduler function gets called directly
  } else {
    // scheduler = () => queuePostRenderEffect(job, instance && instance.suspense); // 'post'
    // scheduler = () => queuePreFlushCb(job); // 'pre' (default)
    scheduler = () => {
      Promise.resolve().then(job);
    };
  }

  const effect = new ReactiveEffect(getter, scheduler);

  effect.onTrack = onTrack;
  effect.onTrigger = onTrigger;

  // initial run
  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect.run();
    }
  } else if (flush === 'post') {
    // queuePostRenderEffect(
    //   effect.run.bind(effect),
    //   instance && instance.suspense
    // );
    Promise.resolve().then(() => {
      effect.run.bind(effect);
    });
  } else {
    effect.run();
  }

  return () => {
    effect.stop();
    // if (instance && instance.scope) {
    //   remove(instance.scope.effects!, effect)
    // }
  };
}

export function traverse(value: unknown, seen?: Set<unknown>) {
  if (!isObject(value) || value[ReactiveFlags.SKIP]) {
    return value;
  }
  seen = seen || new Set();
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  if (isRef(value)) {
    traverse(value.value, seen);
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen);
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v: any) => {
      traverse(v, seen);
    });
  } else if (isPlainObject(value)) {
    for (const key in value) {
      traverse(value[key], seen);
    }
  }
  return value;
}
