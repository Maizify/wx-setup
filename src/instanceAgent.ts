import { reactive, shallowReactive, effectScope, toRef, isReactive } from '@vue/reactivity';
import { watch } from './watch';
import { MethodsAgent } from './methodsAgent';
import type { ShallowReactive } from '@vue/reactivity';
import type { IOptionalMethodOptions } from './methodsAgent'; 
import type { IAnyObject } from './utils';

export enum InstanceType {
  Component = 'Component',
  Behavior = 'Behavior',
  Page = 'Page',
}

let InstanceAgentIdCounter = 0;

/**
 * A placeholder to save component instance's data/methods.
 */
export class InstanceAgent {
  public id: number = ++InstanceAgentIdCounter;
  public instance: WechatMiniprogram.Component.TrivialInstance = undefined;
  public instanceType: InstanceType;
  public useOptionalMethod: IOptionalMethodOptions;
  public methods = new MethodsAgent();
  public props: ShallowReactive<IAnyObject> = undefined;
  // public props = shallowReactive({});
  public canSetData = false;
  public data: IAnyObject = undefined;
  public disuseCallback = new Set<() => void>();
  protected scope: ReturnType<typeof effectScope>;

  public useProps(propsKeys: string[]) {
    if (this.props !== undefined) {
      console.warn('[wx-setup] `useProps()` can only be called ONCE.');
      return;
    }
    // Set initial property value
    this.props = shallowReactive({});
    propsKeys.forEach((k) => {
      this.props[k] = this.instance.properties[k];
    });
  }

  public useData(data: IAnyObject) {
    // console.log('[agent] useData:', data, this.canSetData, this.data);
    if (this.data === undefined) {
      this.data = isReactive(data) ? data : reactive(data);
      this.shallowWatch();
      // console.log('[agent] useData: new', this.data);
    } else {
      for (const key in data) {
        const has = Object.hasOwnProperty.call(this.data, key);
        this.data[key] = data[key];
        // console.log('[agent] useData: append', key, has);
        if (!has) {
          this.shallowWatchKey(key);
        }
      }
    }
    if (this.canSetData) {
      this.instance.setData(data);
    }
    return this.data;
  }

  public saveUnsetData() {
    // console.log('[agent] saveUnsetData', this.canSetData, this.data);
    if (this.canSetData && this.data !== undefined) {
      this.instance.setData(this.data);
    }
  }

  public destroy() {
    this.disuseCallback.forEach((disuseCallback) => {
      disuseCallback();
    });
    this.scope.stop();
    delete this.id;
    delete this.instance;
    delete this.instanceType;
    delete this.useOptionalMethod;
    delete this.methods;
    delete this.props;
    delete this.canSetData;
    delete this.data;
    delete this.disuseCallback;
    delete this.scope;
  }

  /**
   * Watch the first level keys of `this.data`, 
   * then auto `setData()` when data is changed.
   */
  protected shallowWatch() {
    this.scope = effectScope();
    Object.keys(this.data).forEach((key) => {
      this.shallowWatchKey(key);
    });
  }

  protected shallowWatchKey(key: string) {
    const value = toRef(this.data, key);
    this.scope.run(() => {
      // console.log('[agent] shadowWatchKey:', key, value);
      watch(
        value, 
        (newValue) => {
          // console.log('[agent] shallowWatchKey: onChange', key, newValue, this.id, this.instance.is);
          Promise.resolve().then(() => {
            this.canSetData && this.instance && this.instance.setData({ [key]: newValue });
          });
        }, 
        { deep: true }
      );
    });
  }
}
