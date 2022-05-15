import { InstanceType } from './instanceAgent';
import { createComponentOptions } from './runtime';
import type { IPropertyOption, IDefineComponentOptions } from './runtime';

declare let Component: WechatMiniprogram.Component.Constructor;

/**
 * Use `setup()` to define a component.
 * 
 * `Component(options)` will automatically be called finally.
 */
export function defineComponent<TProperty extends IPropertyOption>(options: IDefineComponentOptions<TProperty>) {
  return Component(createComponentOptions(options, InstanceType.Component));
}
