import {h, ref} from '../../../lib/guide-mini-vue.esm.js'

export const App = {
  name: 'App',
  setup() {
    const count = ref(0)
    const props = ref({
      foo: 'foo',
      bar: 'bar'
    })

    const onChangePropsDemo1 = () => {
      props.value.foo = 'new-foo'
    }
    const onChangePropsDemo2 = () => {
      props.value.foo = undefined
    }
    const onChangePropsDemo3 = () => {
      props.value = {
        foo: 'foo'
      }
    }
    const onClick = () => {
      count.value++
    }
    return {
      count,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
      props
    }
  },
  render() {
    return h(
      'div',
      {
        id: 'root', ...this.props
      },
      [
        h('div', {} , 'count: ' + this.count),
        h('button', {onClick: this.onClick}, 'add count'),
        h('button', {onClick: this.onChangePropsDemo1}, '修改 props 中的 foo 的值'),
        h('button', {onClick: this.onChangePropsDemo2}, '将 props 中的 foo 设置为 undefined'),
        h('button', {onClick: this.onChangePropsDemo3}, '删除 props 中的 bar'),
      ]
    )
  }
}