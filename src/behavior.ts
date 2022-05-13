import { createComponentOptions, RuntimeType } from './runtime';
import type { ISetupContext } from './runtime';
import type { IOptionalMethodOptions } from './methodsAgent'; 
import type { IAnyObject } from './utils';

declare let Behavior: WechatMiniprogram.Behavior.Constructor;
type IPropertyOption = WechatMiniprogram.Behavior.PropertyOption;

export interface IDefineBehaviorOptions<TProperty extends IPropertyOption> {
  properties?: TProperty;
  useMethod?: IOptionalMethodOptions;
  setup: (context?: ISetupContext<TProperty>) => { [key: string]: any } | void;
}

/**
 * Use `setup()` to define a behavior.
 * 
 * Returns a `useBehavior` function for `Component({ behaviors: [ useBehavior ] })`.
 * 
 * *Notice:* The APIs for Component methods (like `onLoad() | onReachBottom()`) 
 * will be ignored in behavior's `setup()` function.
 * Because these methods has already been defined in Component's `setup()`.
 * 
 * @reference https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/behaviors.html
 */
export function defineBehavior<TProperty extends IPropertyOption>(options: IDefineBehaviorOptions<TProperty>) {
  type IOptions = WechatMiniprogram.Behavior.Options<IAnyObject, TProperty, IAnyObject>;

  const componentOptions = createComponentOptions(options, RuntimeType.Behavior);
  delete componentOptions.options;

  const useBehavior = function() {
    // console.log('[behavior] useBehavior', componentOptions);
    return Behavior(<IOptions>componentOptions);
  };
  return useBehavior;
}
