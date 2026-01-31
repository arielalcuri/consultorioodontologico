<template>
  <router-view></router-view>
</template>

<script setup>
// Main layout container
</script>

<style>
:root {
    --primary: #0e7490;
    --primary-light: #22d3ee;
    --primary-dark: #155e75;
    --accent: #f59e0b;
    --text-main: #1e293b;
    --text-light: #64748b;
    --bg-body: #f8fafc;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Outfit', sans-serif;
    color: var(--text-main);
    background: var(--bg-body);
}

h1, h2, h3, .font-display {
    font-family: 'Playfair Display', serif;
}
</style>
