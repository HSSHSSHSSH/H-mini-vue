import { h } from '../../../lib/guide-mini-vue.esm.js'
import { foo } from './foo.js'
export const App = {
  render() {
    return h('div', {}, [
      h('h1', {}, 'Hello World'),
      h(foo, {
        count: 1,
        onAdd(a, b) {
          console.log('onAdddddddddddddd', a, b)
        },
        onAddFoo(a, b) {
          console.log('onAddFoo', a, b)
        },
      }),
    ])
    // return h("h1", {}, 'Hello World ' + this.msg)
  },
  setup() {
    return {
      msg: 'mini-vue',
    }
  },
}
