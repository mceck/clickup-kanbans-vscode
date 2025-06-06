import './app.css';
import App from './pages/KanbanApp.svelte';
import { mount } from 'svelte';

const app = mount(App, {
  target: document.body,
});

export default app;
