import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'antd/dist/reset.css'; // Import Ant Design CSS
import './styles/glassmorphism.css'; // Import glassmorphism styles
import './styles/arwes-theme.css'; // Import Arwes theme styles

createRoot(document.getElementById("root")!).render(<App />);
