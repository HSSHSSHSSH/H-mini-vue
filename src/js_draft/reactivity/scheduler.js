const { reactive } = require('./reactive')
const { effect } = require('./effect')


const data = { foo: 1}

const obj = reactive(data)

effect(() => {
  console.log(obj.foo);
})

obj.foo++

console.log('结束');