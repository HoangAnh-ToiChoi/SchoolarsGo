import { useEffect } from 'react';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';

const AuthBootstrap = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const setAuthResolved = useAuthStore((s) => s.setAuthResolved);

  useEffect(() => {
    let mounted = true;

    authService.getMe({ skipAuthRedirect: true })
      .then((response) => {
        if (!mounted) return;
        setUser(response.data.data);
      })
      .catch(() => {
        if (!mounted) return;
        logout();
      })
      .finally(() => {
        if (!mounted) return;
        setAuthResolved(true);
      });

    return () => {
      mounted = false;
    };
  }, [logout, setAuthResolved, setUser]);

  return null;
};

export default AuthBootstrap;
