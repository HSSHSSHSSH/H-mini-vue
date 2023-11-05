const { reactive } = require('./reactive')
const { effect } = require('./effect')


// 控制副作用函数的执行时机
// const data = { foo: 1}

// const obj = reactive(data)

// effect(() => {
//   console.log(obj.foo);
// }, {
//   scheduler: (fn) => {
//     setTimeout(fn, 0)
//   }
// })

// obj.foo++

// console.log('结束');

// 控制副作用函数的执行次数

const data = { foo: 1}
const obj = reactive(data)


const jobQueue = new Set()
const p = Promise.resolve()

let isFlushing = false

function flushJob() {
  if (isFlushing) return

  isFlushing = true
  p.then(() => {
    jobQueue.forEach(job => job())
  }).finally(() => {
    isFlushing = false
  })
}

let fn = function () {
  console.log(obj.foo);
}

effect(fn, {
  scheduler: (fn) => {
    jobQueue.add(fn)
    flushJob()
  }
})

obj.foo++
console.log(jobQueue);
obj.foo++
console.log(jobQueue);

