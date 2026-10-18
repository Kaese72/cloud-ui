import { createApp } from 'vue';
import './theme.css';
import './ui.css';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(router);
// Wait for the first route so the right layout (landing / auth / app shell)
// renders from the start, with no flash of the wrong one.
router.isReady().then(() => app.mount('#app'));
