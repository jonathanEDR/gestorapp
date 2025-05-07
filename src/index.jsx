import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './styles/tailwind.css';   // Asegúrate de que las directivas de Tailwind CSS estén importadas
import './styles/output.css';     // El archivo generado por Tailwind CSS
import { ClerkProvider } from '@clerk/clerk-react';  // Importar ClerkProvider

const clerkPublishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <Router>  
      <App />
      </Router>
    </ClerkProvider>
  </React.StrictMode>
);
reportWebVitals();
