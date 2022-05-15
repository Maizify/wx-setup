`@cosify/wx-setup` - 微信小程序组合式 API
---
[![npm version](https://img.shields.io/npm/v/@cosify/wx-setup/latest.svg)](https://www.npmjs.com/package/@cosify/wx-setup)

更优雅地组织代码——在微信小程序里使用类似 Vue3 的组合式 API（Composition API）和响应性 API（Reactivity API）。

```bash
npm install @cosify/wx-setup
```

```typescript
import { defineComponent, reactive, onAttached } from '@cosify/wx-setup';

defineComponent({
  setup({ props }) {
    const data = reactive({ // 响应式数据
      daddy: { name: '' },
    });
    const sayHi = () => {
      console.log('Hi, ' + data.daddy.name);
    };
    onAttached(() => {      // 生命周期
      data.daddy.name = 'Bob';
      sayHi();              // => Hi, Bob
    });
    return {
      daddy: data.daddy,    // 用于组件 data
      sayHi,                // 用于组件 method
    };
  }
});
```

**注意：尽管基础功能已经完成开发，但目前仍在试验阶段，API 及功能尚未完全稳定，请谨慎使用。**


# 目录

- 01 - 为什么诞生这个库
- 02 - 在已有项目中使用

---

# 01. 为什么诞生这个库
<details>
<summary>【展开/收起】</summary>

在小程序原生框架中，我们必须使用配置式 API（Options API）去注册一个 Page 或 Component。例如：

```typescript
// 官方的注册组件方法
Component({
  data: {
    name: 'Alice'
  },
  lifetimes: {
    attached() {
      this.sayHi();
    }
  },
  methods: {
    sayHi() {
      console.log('Hi, ' + this.data.name);
      // => Hi, Alice
    }
  }
});
```

换言之，`data（数据）`、`lifecycles（生命周期）`、`methods（方法）` 等代码块，均是通过配置的形式塞到 `Page()` 或 `Component()` 构造器中。这导致：

**（1）代码块内的 `this` 指向不明晰。**

> 构造时的 `this` 指向配置对象本身，而实际运行时的 `this` 指向组件实例，这会带来心智负担。  
> 并且在书写配置对象时，写法的差异（如 `observers { a() { this }, b: () => { this } }`）也会导致 `this` 指向不同。

**（2）各代码块不在同一个运行时作用域内。**

> 这导致代码块之间无法共享上下文。例如，methods 之间想共享一个 store 对象，只能将 store 挂载到 `this` 上。久而久之 `this` 上有什么东西将成为谜团。

**（3）TypeScript 类型推导会变得很麻烦，甚至失灵。**

> 基于上述迷因，代码中容易出现大量 `any`，这使得代码组织雪上加霜。


尽管我们可以通过一些手段去规避这些问题，但终归不够优雅。与 Vue2 一样，Options API 是存在局限性的。

于是在 Vue3 中我们有了 Composition API，以另一种形式来组织代码。关于 Composition API 的介绍及优缺点分析，网络上已有很多说明，在此不做展开.

参考本篇开头的示例，基于 `wx-setup`，我们可以在 `setup()` 函数中完成所有组件逻辑，并且它们都在同一个运行时作用域内。这使得我们的代码组织会变得更加容易且优雅。

同时，`wx-setup` 引入了 `@vue/reactivity`，因此响应性数据（`Reactive`、`Ref`）的用法与 Vue3 完全一致。在响应性数据的基础上，我们可以做到自动 `setData()`。

</details>

---

# 02. 在已有项目中使用

<details>
<summary>【展开/收起】</summary>

与 Taro、mpvue、uni-app 等框架不同，`wx-setup` 是完全基于小程序运行时（runtime）的。它更像是一个胶水层，帮助我们去调用小程序原生框架。也就是说，它不需要专门的编译、构建流程，可以做到开箱即用，并很好地在旧项目中渐进式地使用。

因此，如果旧项目是用小程序原生框架，可放心地在新开的 Page、Component 中直接使用 `wx-setup`。已有的 Page 也可根据实际情况来改造成 `wx-setup` 的写法，一般不会有太大的改写难度。

如果旧项目是用第三方小程序框架，考虑到第三方框架有自己的运作方式，故不确定 `wx-setup` 能否正常运作，需开发者根据实际情况来评估。

</details>

---



# 03. Component 组件


# 04. Reactive 响应性数据

# 05. Behavior

# Store 数据状态

# Event 事件通信

