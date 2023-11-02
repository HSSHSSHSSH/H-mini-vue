const set = new Set([1])

// set.forEach(() => {
//   set.delete(1)
//   set.add(1)
//   console.log('蛙叫你');
// })
console.log('开始遍历', set.size);
for (let i = 0; i < set.size; i++) {
  console.log('wuhu');
  set.delete(1)
  set.add(1)
  console.log('蛙叫你');
}
console.log('set', set);
set.clear()
console.log('set', set);
console.log('结束');