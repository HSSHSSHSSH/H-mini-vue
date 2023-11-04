const my_set = new Set()

const fn = () => {
  console.log('fn 执行');
}

my_set.add(fn)
my_set.add(fn)

my_set.add(() => {
  console.log('fn 执行');
})


my_set.add(() => {
  console.log('fn 执行');
})

console.log(my_set);
