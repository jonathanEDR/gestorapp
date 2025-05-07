import React, { useEffect } from 'react';  // Importar useEffect de React
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';  // Importar SignUp de Clerk

function SignUpPage() {
  const { user } = useUser();  // Obtener el usuario autenticado desde Clerk
  const navigate = useNavigate();  // Hook de React Router para redirigir

  // Efecto para redirigir al Dashboard si el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      navigate('/dashboard');  // Redirigir al Dashboard si el usuario está autenticado
    }
  }, [user, navigate]);

  return <SignUp />;  // Renderizar el formulario de registro de Clerk
}

export default SignUpPage;
