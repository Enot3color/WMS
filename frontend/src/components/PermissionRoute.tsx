import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { usePermissions } from '../auth/PermissionsContext';

interface PermissionRouteProps {
  screen: string;
}

export function PermissionRoute({ screen }: PermissionRouteProps) {
  const { hasScreen, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!hasScreen(screen)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
