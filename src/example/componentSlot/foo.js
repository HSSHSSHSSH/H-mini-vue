import { h, renderSlots, getCurrentInstance } from '../../../lib/guide-mini-vue.esm.js'

export const Foo = {
  name: 'Foo',
  setup() {
    const str1 = '蛙叫你！！'
    const str2 = '乌迪尔！！'
    let instance = getCurrentInstance()
    console.log('Foo instance', instance)
    return {
      str1,
      str2,
    }
  },
  render() {
    const foo = h('p', {}, 'foo')
    // 单个插槽与多个插槽
    // return h('div', {}, [foo, renderSlots(this.$slots)])
    // 具名插槽
    // return h('div', {}, [
    //   renderSlots(this.$slots, 'header', { str1: this.str1 }),
    //   foo,
    //   renderSlots(this.$slots, 'footer', { str2: this.str2 }),
    // ])
    // 插槽函数
    return h('div', {}, [
      renderSlots(this.$slots, 'header', { str: this.str1 }),
      foo,
      renderSlots(this.$slots, 'footer', {str: this.str2}),
    ])
  },
}
