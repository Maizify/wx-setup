
import { InstanceType } from './instanceAgent';
import { agentStack } from './instanceAgentPool';
import { OptionalMethods } from './methodsAgent';
import type { InstanceAgent } from './instanceAgent';

function setAgentMethod<T extends keyof InstanceAgent['methods']>(method: T, cb: InstanceAgent['methods'][T], componentOnly = false) {
  const agent = agentStack.last();
  // console.log('setAgentMethod', method, agent);
  if (!agent) {
    console.warn(`[wx-setup] \`${method}()\` must be called in \`setup()\` function.`);
    return;
  }
  if (!!componentOnly && agent.instanceType === InstanceType.Behavior) {
    console.warn(`[wx-setup] Invalid \`${method}()\` calling. It can only be used for \`Component\`.`);
    return;
  }
  if (OptionalMethods.indexOf(<any>method) > -1 && !agent.useOptionalMethod[<any>method]) {
    console.warn(`[wx-setup] Set \`useMehod.${method} = true\` to enable \`${method}()\`.`);
  }
  agent.methods[method] = cb;
}

export function onCreated(cb: InstanceAgent['methods']['onCreated']) {
  setAgentMethod('onCreated', cb);
};

export function onAttached(cb: InstanceAgent['methods']['onAttached']) {
  setAgentMethod('onAttached', cb);
};

export function onReady(cb: InstanceAgent['methods']['onReady']) {
  setAgentMethod('onReady', cb);
};

export function onMoved(cb: InstanceAgent['methods']['onMoved']) {
  setAgentMethod('onMoved', cb);
};

export function onDetached(cb: InstanceAgent['methods']['onDetached']) {
  setAgentMethod('onDetached', cb);
};

export function onError(cb: InstanceAgent['methods']['onError']) {
  setAgentMethod('onError', cb);
};

export function onShow(cb: InstanceAgent['methods']['onShow']) {
  setAgentMethod('onShow', cb);
};

export function onHide(cb: InstanceAgent['methods']['onHide']) {
  setAgentMethod('onHide', cb);
};

export function onResize(cb: InstanceAgent['methods']['onResize']) {
  setAgentMethod('onResize', cb);
};

export function onLoad(cb: InstanceAgent['methods']['onLoad']) {
  setAgentMethod('onLoad', cb, true);
};

export function onUnload(cb: InstanceAgent['methods']['onUnload']) {
  setAgentMethod('onUnload', cb, true);
};

export function onPullDownRefresh(cb: InstanceAgent['methods']['onPullDownRefresh']) {
  setAgentMethod('onPullDownRefresh', cb, true);
};

export function onReachBottom(cb: InstanceAgent['methods']['onReachBottom']) {
  setAgentMethod('onReachBottom', cb, true);
};

/**
 * Set `useMethod.onShareAppMessage: true` in `defineComponent()` to enable.
 * 
 * Can only be called *ONCE*.
 */
export function onShareAppMessage(cb: InstanceAgent['methods']['onShareAppMessage']) {
  setAgentMethod('onShareAppMessage', cb, true);
};

/**
 * Set `useMethod.onShareTimeline: true` in `defineComponent()` to enable.
 * 
 * Can only be called *ONCE*.
 */
export function onShareTimeline(cb: InstanceAgent['methods']['onShareTimeline']) {
  setAgentMethod('onShareTimeline', cb, true);
};

/**
 * Can only be called *ONCE*.
 */
export function onAddToFavorites(cb: InstanceAgent['methods']['onAddToFavorites']) {
  setAgentMethod('onAddToFavorites', cb, true);
};

/**
 * Set `useMethod.onPageScroll: true` in `defineComponent()` to enable.
 */
export function onPageScroll(cb: InstanceAgent['methods']['onPageScroll']) {
  setAgentMethod('onPageScroll', cb, true);
};

export function onTabItemTap(cb: InstanceAgent['methods']['onTabItemTap']) {
  setAgentMethod('onTabItemTap', cb, true);
};

export function onSaveExitState(cb: InstanceAgent['methods']['onSaveExitState']) {
  setAgentMethod('onSaveExitState', cb, true);
};
