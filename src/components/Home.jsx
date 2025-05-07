import React, { useEffect } from 'react'; 
import { useUser } from '@clerk/clerk-react';  
import { useNavigate } from 'react-router-dom';  
import { Link } from 'react-router-dom';  

function Home() {
  const { user } = useUser();  // Obtener el estado del usuario desde Clerk
  const navigate = useNavigate();  // Hook de React Router para redirigir

  // Si el usuario está autenticado, redirigir a Dashboard
  useEffect(() => {
    
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]); 

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-3xl font-bold text-center mb-4">Welcome to Home Page!</h1>
        <p className="text-lg text-center mb-6">If you are not logged in, you can:</p>
        
        {/* Botones de Login y Signup */}
        <div className="flex gap-4">
          <Link 
            to="/login" 
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
          >
            Log In
          </Link>
          <Link 
            to="/signup" 
            className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-200"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return null;  // Si el usuario está autenticado, no renderizamos nada aquí
}

export default Home;
