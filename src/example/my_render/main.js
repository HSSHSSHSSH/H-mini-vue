import { createRenderer } from '../../../lib/guide-mini-vue.esm.js'
import {
  createElement,
  setElementText,
  insert,
  patchProps,
  unmount,
} from './handlers/elementHandlers.js'
const renderer = createRenderer({
  createElement,
  setElementText,
  insert,
  patchProps,
  unmount
})



const vnode = {
  type: 'h1',
  children: [
    {
      type: 'form',
      props: {
        class: 'my_class1',
        id: 'form2',
      },
      children: '4560',
    },
    {
      type: 'input',
      props: {
        class:['my_class2', 'my_class3'],
        form: 'form2',
      },
      children: '乌迪尔！！乌迪尔！！！',
    },
    {
      type: 'div',
      props: {
        class: {
          my_class4: true,
          my_class5: false,
        }
      },
      children: '蛙叫你'
    }
  ],
}
renderer(vnode, document.getElementById('app'))

