import { h, createTextNode, getCurrentInstance } from '../../../lib/guide-mini-vue.esm.js'
import { Foo } from './foo.js'

export const App = {
  name: 'App',
  setup() {
    let instance = getCurrentInstance()
    console.log('App instance', instance)
    return {}
  },
  render() {
    const app = h('div', {}, 'App')
    // 单个插槽与多个插槽
    // const foo = h(Foo, {}, h("p", {}, "123"))
    // 具名插槽
    // const foo = h(Foo, {}, {
    //   header:  h('p', {}, 'header'),
    //   footer:  h('p', {}, 'footer'),
    // })
    // 插槽函数
    const foo = h(
      Foo,
      {},
      {
        header: ({ str }) => [h('p', {}, 'header' + str), createTextNode('哇哇哇哇哇')],
        footer: ({ str }) => h('p', {}, 'footer' + str),
      },
    )
    return h('div', {}, [app, foo])
  },
}
