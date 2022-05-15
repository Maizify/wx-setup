import { InstanceType } from './instanceAgent';
import type { InstanceAgent } from './instanceAgent';

type ITrivialInstance = WechatMiniprogram.Component.TrivialInstance | WechatMiniprogram.Behavior.TrivialInstance;

/**
 * A stack to get the actived (last) agent.
 * 
 * Used for composition APIs (like `onLoad()`) in `setup()` functions.
 */
export const agentStack = new class AgentStack extends Array<InstanceAgent> {
  public last() {
    return this[this.length - 1];
  }
}

/**
 * A map manager to get the agent of a component or a behavior.
 */
export const agentMap = new class AgentMap {
  public componentAgentMap = new WeakMap<ITrivialInstance, InstanceAgent>();
  public behaviorAgentMap = new WeakMap<ITrivialInstance, InstanceAgent>();

  public has(type: InstanceType, instance: ITrivialInstance) {
    return this.getMap(type).has(instance);
  }

  public get(type: InstanceType, instance: ITrivialInstance) {
    return this.getMap(type).get(instance);
  }

  public set(type: InstanceType, instance: ITrivialInstance, agent: InstanceAgent) {
    return this.getMap(type).set(instance, agent);
  }

  public delete(type: InstanceType, instance: ITrivialInstance) {
    return this.getMap(type).delete(instance);
  }

  protected getMap(type: InstanceType) {
    // 'Page' and 'Component' share the `componentAgentMap`.
    return type === InstanceType.Behavior ? this.behaviorAgentMap : this.componentAgentMap;
  }
}
