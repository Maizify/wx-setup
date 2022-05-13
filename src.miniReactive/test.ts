import { reactive } from './reactive';
import { effect } from './effect';

const data = reactive({
  msg: 'msgValue111',
  // a: {
  //   b: 1
  // },
}, (path, value) => {
  // console.log('onUpdate:', path, value);
});

// const eff = effect(() => {
//   const value = data.msg;
//   console.log('onEffect:', value);
//   console.log('onEffet set value...');
//   // data.msg += 'msgValue333';
//   return value;
// }, { });
// console.log(eff.run());

// console.log('start to set value...');
// data.msg = 'msgValue222';
// data.a.b = 2;
