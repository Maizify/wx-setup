import { reactive, isReactive } from '@vue/reactivity';
import { agentStack } from './instanceAgent';
import type { UnwrapNestedRefs } from '@vue/reactivity';

/**
 * Use a reactive data for `setData()`.
 * 
 * *MUST BE* called *IN* `setup()` and *OUT OF* lifecycle events (like `onLoad()`) 
 * or user events (like `onTapButton()`).
 * 
 * Returns the original reactive data or `reactive(data)` if it isn't reactive.
 * 
 * The value in first level key *MUST BE* `Ref` or `Reactive` when called, 
 * otherwise it won't be tracked.
 * 
 * When called multiple times, data will be merged.
 */
export function useData<T extends object>(data: T) {
  const agent = agentStack.last();
  if (!agent) {
    console.warn('[wx-setup] Invalid `useData()` calling: No actived component instance.');
    return;
  }
  // console.log('[useData]', data);
  const reactiveData = !isReactive(data) ? reactive(data) : data as UnwrapNestedRefs<T>;
  agent.useData(reactiveData);
  return reactiveData;
}

/**
 * Get the current component instance.
 * 
 * *MUST BE* called *IN* `setup()` and *OUT OF* lifecycles or user events.
 */
export function getCurrentInstance() {
  const agent = agentStack.last();
  if (!agent) {
    console.warn('[wx-setup] Invalid `getCurrentInstance()` calling: No actived component instance.');
    return;
  }
  return agent.instance;
}
