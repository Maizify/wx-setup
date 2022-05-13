export type IOptionalMethodOptions = { [k in typeof OptionalMethods[number]]?: boolean };

export const OptionalMethods = <const>['onShareAppMessage', 'onShareTimeline', 'onPageScroll'];
export const OnceMethods = <const>['onShareAppMessage', 'onShareTimeline', 'onAddToFavorites'];

class CallbackAgent {
  protected callbackListMap: Map<string | symbol, Function[]> = new Map();

  constructor() {
    return new Proxy(this, {
      set(target, key, value) {
        if (typeof value === 'function') {
          const callbackListMap = target.callbackListMap;
          let callbackList = callbackListMap.get(key);
          if (!callbackList) {
            callbackList = [];
          }
          callbackList.push(value);
          callbackListMap.set(key, callbackList);
          return true;
        } else {
          return Reflect.set(target, key, value);
        }
      },
      get(target, key: string) {
        const value = Reflect.get(target, key);
        if (key === 'callbackListMap') {
          return value;
        }
        // The remaining properites MUST BE callbacks.
        const callbackListMap = target.callbackListMap;
        const callbackList = callbackListMap.get(key) || [];
        // Some methods can only be called once.
        // Thus directly call the first callback.
        if (OnceMethods.indexOf(<any>key) > -1) {
          return (...args) => {
            if (callbackList[0]) {
              return callbackList[0](...args);
            }
          };
        }
        return async (...args) => {
          let ret: any = undefined;
          for (let i = 0; i < callbackList.length; i++) {
            const ret = callbackList[i](...args);
            if (ret instanceof Promise) {
              await Promise.resolve(ret);
            }
          }
          return ret;
        };
      },
    });
  }
}

export class MethodsAgent extends CallbackAgent {
  // component lifetimes (in Component.lifetims)
  public onCreated: WechatMiniprogram.Component.Lifetimes['lifetimes']['created'];
  public onAttached: WechatMiniprogram.Component.Lifetimes['lifetimes']['attached'];
  public onReady: WechatMiniprogram.Component.Lifetimes['lifetimes']['ready'];
  public onMoved: WechatMiniprogram.Component.Lifetimes['lifetimes']['moved'];
  public onDetached: WechatMiniprogram.Component.Lifetimes['lifetimes']['detached'];
  public onError: WechatMiniprogram.Component.Lifetimes['lifetimes']['error'];

  // page lifetimes (in Component.pageLifetimes)
  public onShow: WechatMiniprogram.Page.ILifetime['onShow'];
  public onHide: WechatMiniprogram.Page.ILifetime['onHide'];
  public onResize: WechatMiniprogram.Page.ILifetime['onResize'];

  // page lifetimes & events (in Component.methods)
  public onLoad: WechatMiniprogram.Page.ILifetime['onLoad'];
  public onUnload: WechatMiniprogram.Page.ILifetime['onUnload'];
  public onPullDownRefresh: WechatMiniprogram.Page.ILifetime['onPullDownRefresh'];
  public onReachBottom: WechatMiniprogram.Page.ILifetime['onReachBottom'];
  public onShareAppMessage: WechatMiniprogram.Page.ILifetime['onShareAppMessage'];
  public onShareTimeline: WechatMiniprogram.Page.ILifetime['onShareTimeline'];
  public onAddToFavorites: WechatMiniprogram.Page.ILifetime['onAddToFavorites'];
  public onPageScroll: WechatMiniprogram.Page.ILifetime['onPageScroll'];
  public onTabItemTap: WechatMiniprogram.Page.ILifetime['onTabItemTap'];
  public onSaveExitState: () => void;
}
