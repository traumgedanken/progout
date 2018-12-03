<template>
  <div id="app">
    <header>
      <h1>Vue.js SPA</h1>
    </header>
    <main>
      <aside class="sidebar">
        <router-link
          v-for="post in posts"
          active-class="is-active"
          class="link"
          :to="{ name: 'post', params: { id: post.id } }"
        >{{post.id}}. {{post.title}}</router-link>
      </aside>
      <div class="content">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      posts: []
    };
  }
};

import axios from 'axios'
export default {
  data () {
    return {
      posts: null,
      endpoint: 'https://jsonplaceholder.typicode.com/posts/',
    }
  },

  created() {
    this.getAllPosts();
  },

  methods: {
    getAllPosts() {
      axios.get(this.endpoint)
        .then(response => {
          this.posts = response.data;
        })
        .catch(error => {
          console.log('-----error-------');
          console.log(error);
        })
    }
  }
}
</script>