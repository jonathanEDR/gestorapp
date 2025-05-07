import React, { useEffect } from 'react';  // Importar useEffect de React
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';  // Importar SignIn de Clerk

function Login() {
  const { user } = useUser();  // Obtener el usuario autenticado desde Clerk
  const navigate = useNavigate();  // Hook de React Router para redirigir

  // Efecto para redirigir al Dashboard si el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      console.log('Usuario autenticado:', user);
      navigate('/dashboard');  // Redirigir al Dashboard si el usuario está autenticado
    }
  }, [user, navigate]);

  return <SignIn />;  // Renderizar el formulario de inicio de sesión de Clerk
}

export default Login;
