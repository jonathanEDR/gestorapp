import React, { useState, useEffect } from 'react';
import { useSignUp, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Check } from 'lucide-react';

function SignUpPage() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoaded) return;

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUp.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailAddress: formData.email,
        password: formData.password,
      });

      // Enviar código de verificación por email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      console.error('Error en registro:', err);
      setError(err.errors?.[0]?.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status !== 'complete') {
        console.log(JSON.stringify(completeSignUp, null, 2));
        setError('Error en la verificación');
        return;
      }

      await setActive({ session: completeSignUp.createdSessionId });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error en verificación:', err);
      setError(err.errors?.[0]?.message || 'Código de verificación inválido');
    } finally {
      setLoading(false);
    }
  };

  const signUpWithGoogle = async () => {
    if (!isLoaded) return;

    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err) {
      console.error('Error con Google:', err);
      setError('Error al iniciar sesión con Google');
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setFormData({...formData, password: newPassword});
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Débil';
    if (passwordStrength <= 3) return 'Media';
    return 'Fuerte';
  };

  // Si está pendiente la verificación, mostrar formulario de código
  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Verifica tu email
              </h1>
              <p className="text-gray-600">
                Hemos enviado un código de verificación a {formData.email}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center space-x-2">
                <div className="w-5 h-5 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs">!</span>
                </div>
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Código de verificación
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ingresa el código de 6 dígitos"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <button
                onClick={onPressVerify}
                disabled={loading || !code}
                className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 transform ${
                  loading || !code
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verificando...</span>
                  </div>
                ) : (
                  'Verificar cuenta'
                )}
              </button>

              <button
                onClick={() => setPendingVerification(false)}
                className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Volver al registro
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Tarjeta principal */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Crea tu cuenta
            </h1>
            <p className="text-gray-600">
              Únete a nuestra plataforma y comienza tu experiencia
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center space-x-2">
              <div className="w-5 h-5 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-xs">!</span>
              </div>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Formulario */}
          <div className="space-y-5">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  Nombre
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="Tu nombre"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  Apellido
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="Tu apellido"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handlePasswordChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Indicador de fuerza de contraseña */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Seguridad:</span>
                    <span className={`text-xs font-medium ${passwordStrength <= 2 ? 'text-red-500' : passwordStrength <= 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                
                {/* Indicador de coincidencia */}
                {formData.confirmPassword && (
                  <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                    {formData.password === formData.confirmPassword ? (
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-xs">✕</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botón de registro */}
            <button
              onClick={handleSubmit}
              disabled={loading || !isLoaded}
              className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 transform ${
                loading || !isLoaded
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creando cuenta...</span>
                </div>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">o continúa con</span>
            </div>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={signUpWithGoogle}
            disabled={!isLoaded}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-gray-700 font-medium">Continuar con Google</span>
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                Inicia sesión
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;