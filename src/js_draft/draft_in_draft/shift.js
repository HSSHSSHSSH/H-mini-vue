const my_stack = []

let top = my_stack[0]

function my_log() {
  console.log(my_stack);
  console.log(top);
};

my_log()

my_stack.unshift({
  name: '蛙叫你'
})

my_log()