<template>
  <div class="status enter">
    <div class="status-card">
      <p class="kicker">404</p>
      <h1 class="page-title">This room doesn't exist.</h1>
      <p class="page-lede">The page you're looking for isn't here.</p>
      <router-link to="/home" class="btn btn-primary">Go home</router-link>
    </div>
  </div>
</template>

<style scoped>
.status {
  min-height: 55vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.status-card {
  max-width: 440px;
  text-align: center;
}
.status-card .page-lede {
  margin-left: auto;
  margin-right: auto;
}
</style>
