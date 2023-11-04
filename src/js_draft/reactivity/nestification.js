const {reactive} = require('../reactivity/reactive')
const {effect} = require('../reactivity/effect')

const obj = reactive({
  foo: '000',
  bar: '111'
})

let temp1, temp2
let outer_called_times = 0
let inner_called_times = 0

effect(() => {
  outer_called_times++
  effect(() => {
    inner_called_times++
    temp2 = obj.bar
  })
  temp1 = obj.foo
})

console.log(outer_called_times, inner_called_times);

obj.foo = '222'

console.log(outer_called_times, inner_called_times);
