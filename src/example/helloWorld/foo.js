import { h } from '../../../lib/guide-mini-vue.esm.js'

export const foo = {
  setup(props, {emit}) {
    console.log('foo setup props', props)
    // props.count++

    const emitAdd = () => {
      emit('add', 1,2)
      emit('add-foo', 3, 4)
      console.log('emit add')
    }

    return {
      emitAdd
    }
  },
  render() {
    const btn = h('button', { onClick: this.emitAdd }, 'add')
    const span = h('span', {}, '  蛙叫你 ' + this.count)
    return h('div', {}, [btn, span])
  },
}
