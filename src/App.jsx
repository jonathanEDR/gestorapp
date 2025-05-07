import React, { useEffect } from 'react';  
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';  // Importar Clerk
import { useNavigate } from 'react-router-dom';  // Importar hook para redirigir
import Login from './components/Login';
import Dashboard from './components/Dashboard'; 
import SignUp from './components/Signup';
import Home from './components/Home';

function App() {

  return (
      <Routes>
        <Route index path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
  );
}

export default App;
