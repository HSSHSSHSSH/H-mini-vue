const {reactive} = require('./reactive')
const {effect} = require('./effect')


const data = {ok : false, text: 'hello world'}

const obj = reactive(data)

let text = "芜湖！！"

effect(() => {
  text = obj.ok ? obj.text : 'not'
  console.log('副作用函数触发');
})


obj.ok = false

obj.text = 'hello world 2'