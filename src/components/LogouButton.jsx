import React from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
  const { signOut } = useClerk();  // Clerk hook para cerrar sesión
  const navigate = useNavigate();   // React Router hook para redirigir

  const handleLogout = () => {
    signOut();  // Llama al método signOut de Clerk para cerrar la sesión
    navigate('/');  // Redirige al usuario a la página de login después de cerrar sesión
  };

  return <button onClick={handleLogout}>Cerrar sesión</button>;
}

export default LogoutButton;
