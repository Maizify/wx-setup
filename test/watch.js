import { reactive, watch } from '../dist/index.js';

(async () => {

  const data = reactive({
    msg: '111',
    a: {
      b: 1,
    },
  });

  // watch(() => data.msg, (newValue, oldValue) => {
  //   console.log('Watch() data.msg:', newValue, oldValue);
  // });
  // watch(() => data.a, (newValue, oldValue) => {
  //   console.log('Watch() data.a:', newValue, oldValue);
  // }, { deep: true });
  watch(() => data, (newValue, oldValue) => {
    console.log('Watch() data:', newValue, oldValue);
  }, { deep: true });
  
  console.log('changing data...');
  // data.msg = '222';
  data.a.b = 2;
  // data.a = { b: 3 };

})();
