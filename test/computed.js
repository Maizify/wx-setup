import { reactive, toRef, computed } from '../dist/index.js';

(async () => {

  const data = reactive({
    msg: '111',
    a: {
      b: 2,
    },
  });
  const msg = toRef(data, 'msg');

  const a = computed(() => {
    console.log('computed');
    return 'ccc-' + msg.value;
  });

  data.msg = '222';
  console.log(a.value);

})();
