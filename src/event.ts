import { agentStack } from './instanceAgent';
import { InstanceAgent } from './instanceAgent';

type IUseEvent<TData extends any> = () => EventAgent<TData>;

export interface IDefineEventOptions {
  /**
   * The ID of the event.
   * 
   * *MUST BE* global unique.
   */
  id: string;
}

const defineMap = new Map<string, IUseEvent<unknown>>();
const eventChannelMap = new Map<string, EventChannel>();

class EventChannel<TData = any> {
  public readonly id: string;
  public instanceToEvent = new WeakMap<InstanceAgent, EventAgent<TData>>();
  public eventAgentSet = new Set<EventAgent<TData>>();

  constructor(options: IDefineEventOptions) {
    this.id = options.id;
  }

  public getEventAgent(agent: InstanceAgent) {
    let eventAgent = this.instanceToEvent.get(agent);
    if (!eventAgent) {
      eventAgent = new EventAgent(this.id);
      this.instanceToEvent.set(agent, eventAgent);
      this.eventAgentSet.add(eventAgent);
    }
    return eventAgent;
  }

  public removeEventAgent(agent: InstanceAgent) {
    const eventAgent = this.instanceToEvent.get(agent);
    if (eventAgent) {
      eventAgent.destroy();
      this.instanceToEvent.delete(agent);
    }
  }

  public destroy() {
    this.eventAgentSet.clear();
    delete this.instanceToEvent;
    delete this.eventAgentSet;
  }
}

class EventAgent<TData = any> {
  public readonly id: string;
  protected callback: (data?: TData) => void;

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Listen the event.
   */
  public on(cb: EventAgent<TData>['callback']) {
    this.callback = cb;
  }

  /**
   * Cancel listening the event.
   */
  public off() {
    this.callback = undefined;
  }

  /**
   * Dispatch a event to other listeners.
   */
  public emit(data?: TData) {
    const eventChannel: EventChannel<TData> = eventChannelMap.get(this.id);
    if (!eventChannel) {
      return false;
    }

    eventChannel.eventAgentSet.forEach((eventAgent) => {
      if (eventAgent !== this) {
        if (typeof eventAgent.callback === 'function') {
          eventAgent.callback(data);
        }
      }
    });
    return true;
  }

  public destroy() {
    delete this.callback;
  }
}

export function defineEvent<TData extends any>(options: IDefineEventOptions) {
  let useEvent = <IUseEvent<TData>>defineMap.get(options.id);
  if (useEvent) {
    console.warn(`[wx-setup] Event with id="${options.id}" has already been defined.`);
    return useEvent;
  }

  let useCount = 0;

  useEvent = function() {
    const agent = agentStack.last();
    if (!agent) {
      throw new Error('`useEvent()` can only be called in component\'s `setup()` function.');
    }

    const disuesEvent = function() {
      if (!agent) {
        throw new Error('`disuesEvent()` can only be called after `useEvent()`.');
      }
  
      if (agent.disuseCallback.has(disuesEvent)) {
        agent.disuseCallback.delete(disuesEvent);
        useCount--;
      }
      console.log('[event] disuesEvent()', options.id, agent.instance.is, 'useCount:', useCount);
  
      const eventChannel: EventChannel<TData> = eventChannelMap.get(options.id);
      if (eventChannel) {
        eventChannel.removeEventAgent(agent);
      }
      
      if (useCount <= 0) {
        useCount = 0;
        if (eventChannel) {
          eventChannel.destroy();
          eventChannelMap.delete(options.id);
        }
      }
    };

    let eventChannel: EventChannel<TData> = eventChannelMap.get(options.id);
    if (!eventChannel) {
      eventChannel = new EventChannel(options);
      eventChannelMap.set(options.id, eventChannel);
    }

    if (!agent.disuseCallback.has(disuesEvent)) {
      agent.disuseCallback.add(disuesEvent);
      useCount++;
    }

    console.log('[event] useEvent()', options.id, agent.instance.is, 'useCount:', useCount);
    return eventChannel.getEventAgent(agent);
  };

  defineMap.set(options.id, useEvent);
  return useEvent;
}
