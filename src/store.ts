import { reactive, toRaw } from '@vue/reactivity';
import { agentStack } from './instanceAgentPool';
import { EMPTY_OBJECT } from './utils';
import type { UnwrapNestedRefs } from '@vue/reactivity';

export type IState = { [key: string]: any };
export type IActions = { [key: string]: Function };
export type IUseStore<
  TState extends IState, 
  TActions extends IActions, 
  TId extends string
> = () => ReactiveStore<TState, TActions, TId>;

export interface IDefineStoreOptions<
  TState extends IState, 
  TActions extends IActions, 
  TId extends string
> {
  /**
   * The ID of the store.
   * 
   * *MUST BE* global unique.
   */
  id: TId;
  /**
   * Returns the state data of the store.
   * 
   * The state will be wrapped as `Reactive`.
   * 
   * Called when init a store or calling `reset()`.
   */
  state: () => TState;
  /**
   * Returns the action functions of the store.
   * 
   * Reacitve state data by `state()` will be sent as the parameter.
   */
  setup?: (state: UnwrapNestedRefs<TState>, store: ReactiveStore<TState, TActions, TId>) => TActions;
}

const defineMap = new Map<string, IUseStore<any, any, any>>();
const storeMap = new Map<string, ReactiveStore<any, any, any>>();

class ReactiveStore<
  TState extends IState, 
  TActions extends IActions, 
  TId extends string
> {
  public readonly id: TId;
  public state: UnwrapNestedRefs<TState>;
  public actions: TActions = <TActions>EMPTY_OBJECT;
  protected options: IDefineStoreOptions<TState, TActions, TId>;

  constructor (options: IDefineStoreOptions<TState, TActions, TId>) {
    this.id = options.id;
    this.state = reactive(options.state());
    if (typeof options.setup === 'function') {
      this.actions = options.setup(this.state, this);
    }
    this.options = options;
  }

  public toRaw() {
    return <TState>toRaw(this.state);
  }

  public reset() {
    this.state = reactive(this.options.state());
  }

  public destroy() {
    delete this.state;
    delete this.actions;
    delete this.options;
  }
}

/**
 * Defining a unique store.
 * 
 * Returns a `useStore()` function to get store instance.
 * 
 * 1. `useStore()` can only be called in comopnent's `setup()` function.
 * 2. When `useStore()` is called,
 *    the store will be created as a singleton by it's `id`,
 *    and attached to the current component instance.
 *    A store can be attached to multiple instances.
 * 3. When a component instance is dettached, 
 *    the store will be dettached to this instance.
 * 4. After dettaching to all instances, the store will be destroyed.
 */
export function defineStore<
  TState extends IState, 
  TActions extends IActions, 
  TId extends string
>(options: IDefineStoreOptions<TState, TActions, TId>) {
  let useStore = <IUseStore<TState, TActions, TId>>defineMap.get(options.id);
  if (useStore) {
    console.warn(`[wx-setup] Store with id="${options.id}" has already been defined.`);
    return useStore;
  }

  let useCount = 0;

  useStore = function() {
    const agent = agentStack.last();
    if (!agent) {
      throw new Error('`useStore()` can only be called in component\'s `setup()` function.');
    }

    const disuseStore = function() {
      if (!agent) {
        throw new Error('`disuseStore()` can only be called after `useStore()`.');
      }
  
      if (agent.disuseCallback.has(disuseStore)) {
        agent.disuseCallback.delete(disuseStore);
        useCount--;
      }
      // console.log('[store] disuseStore()', options.id, agent.instance.is, 'useCount:', useCount);
  
      if (useCount <= 0) {
        useCount = 0;
        const store = storeMap.get(options.id);
        if (store) {
          store.destroy();
          storeMap.delete(options.id);
        }
      }
      return true;
    };

    let store: ReactiveStore<TState, TActions, TId> = storeMap.get(options.id);
    if (!store) {
      store = new ReactiveStore(options);
      storeMap.set(options.id, store);
    }

    if (!agent.disuseCallback.has(disuseStore)) {
      agent.disuseCallback.add(disuseStore);
      useCount++;
    }
    // console.log('[store] useStore()', options.id, agent.instance.is, 'useCount:', useCount);

    return store;
  };
  
  defineMap.set(options.id, useStore);
  return useStore;
}
