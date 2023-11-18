export const MyComponent = {
  name:'MyComponent',
  data() {
    return {
      foo: 1
    }
  },
  // beforeCreate() {
  //   console.log('beforeCreate')
  // },
  // created() {
  //   console.log('created')
  // },
  // beforeMount() {
  //   console.log('beforeMount')
  // },
  // mounted() {
  //   console.log('mounted')
  // },
  // beforeUpdate() {
  //   console.log('beforeUpdate')
  // },
  // updated() {
  //   console.log('updated')
  // },
  props: {
    title: String,
  },
  render() {
    return {
      type: 'div',
      children: `${this.title} ${this.foo}` 
    }
  }
}