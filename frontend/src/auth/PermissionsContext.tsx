import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchMyPermissions } from '../api/permissions';
import { useAuth } from './AuthContext';
import type { PermissionAction, ScreenPermission } from '../types/permissions';

interface PermissionsContextValue {
  permissions: ScreenPermission[];
  isLoading: boolean;
  can: (screenCode: string, action: PermissionAction) => boolean;
  hasScreen: (screenCode: string) => boolean;
  reloadPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(
  undefined,
);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<ScreenPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reloadPermissions = useCallback(async () => {
    if (!localStorage.getItem('accessToken')) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchMyPermissions();
      setPermissions(response.permissions);
    } catch {
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    reloadPermissions();
  }, [isAuthenticated, reloadPermissions]);

  const can = useCallback(
    (screenCode: string, action: PermissionAction) => {
      const record = permissions.find((item) => item.screenCode === screenCode);
      if (!record?.canRead) {
        return false;
      }

      switch (action) {
        case 'read':
          return record.canRead;
        case 'create':
          return record.canCreate;
        case 'update':
          return record.canUpdate;
        case 'delete':
          return record.canDelete;
        default:
          return false;
      }
    },
    [permissions],
  );

  const hasScreen = useCallback(
    (screenCode: string) => can(screenCode, 'read'),
    [can],
  );

  const value = useMemo(
    () => ({
      permissions,
      isLoading,
      can,
      hasScreen,
      reloadPermissions,
    }),
    [permissions, isLoading, can, hasScreen, reloadPermissions],
  );

  return (
    <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}
