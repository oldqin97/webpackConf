import { str, printf } from './ts/index';

new Promise(resolve => {
  resolve(1);
}).then(res => {
  printf(res);
  printf(str);
});
