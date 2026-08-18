import { Button, Checkbox, Table, Tabs, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  fetchPermissionsMatrix,
  updatePermissionsMatrix,
} from '../api/permissions';
import { usePermissions } from '../auth/PermissionsContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import type { PermissionsMatrix, ScreenPermission } from '../types/permissions';
import { ROLE_LABELS, SCREEN_CODES } from '../types/permissions';

type EditableScreen = ScreenPermission & { key: string };

function normalizeFlags(flags: {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const canRead = flags.canRead;
  return {
    canRead,
    canCreate: canRead && flags.canCreate,
    canUpdate: canRead && flags.canUpdate,
    canDelete: canRead && flags.canDelete,
  };
}

export function PermissionsPage() {
  const queryClient = useQueryClient();
  const { can, reloadPermissions } = usePermissions();
  const { isMobile } = useBreakpoint();
  const [draft, setDraft] = useState<PermissionsMatrix | null>(null);
  const [activeRole, setActiveRole] = useState<string>('ADMIN');

  const canEdit = can(SCREEN_CODES.PERMISSIONS, 'update');

  const matrixQuery = useQuery({
    queryKey: ['permissions-matrix'],
    queryFn: fetchPermissionsMatrix,
  });

  const matrix = draft ?? matrixQuery.data ?? null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!matrix) return null;

      const items = matrix.roles.flatMap((roleBlock) =>
        roleBlock.screens.map((screen) => ({
          role: roleBlock.role,
          screenCode: screen.screenCode,
          permissions: normalizeFlags(screen),
        })),
      );

      return updatePermissionsMatrix(items);
    },
    onSuccess: async (data) => {
      message.success('Настройки доступов сохранены');
      setDraft(data ?? null);
      queryClient.setQueryData(['permissions-matrix'], data);
      await reloadPermissions();
    },
    onError: () => message.error('Не удалось сохранить настройки'),
  });

  const roleScreens = useMemo(() => {
    const roleBlock = matrix?.roles.find((item) => item.role === activeRole);
    return (
      roleBlock?.screens.map((screen) => ({
        ...screen,
        key: screen.screenCode,
      })) ?? []
    );
  }, [matrix, activeRole]);

  function updateScreen(
    screenCode: string,
    patch: Partial<Pick<ScreenPermission, 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete'>>,
  ) {
    if (!matrix) return;

    setDraft({
      roles: matrix.roles.map((roleBlock) => {
        if (roleBlock.role !== activeRole) {
          return roleBlock;
        }

        return {
          ...roleBlock,
          screens: roleBlock.screens.map((screen) => {
            if (screen.screenCode !== screenCode) {
              return screen;
            }

            const next = normalizeFlags({ ...screen, ...patch });
            return { ...screen, ...next };
          }),
        };
      }),
    });
  }

  const columns: ColumnsType<EditableScreen> = [
    {
      title: 'Экран',
      dataIndex: 'screenName',
      key: 'screenName',
    },
    {
      title: 'Чтение',
      dataIndex: 'canRead',
      key: 'canRead',
      width: 100,
      render: (value: boolean, record) => (
        <Checkbox
          checked={value}
          disabled={!canEdit}
          onChange={(event) =>
            updateScreen(record.screenCode, {
              canRead: event.target.checked,
              canCreate: event.target.checked ? record.canCreate : false,
              canUpdate: event.target.checked ? record.canUpdate : false,
              canDelete: event.target.checked ? record.canDelete : false,
            })
          }
        />
      ),
    },
    {
      title: 'Создание',
      dataIndex: 'canCreate',
      key: 'canCreate',
      width: 110,
      render: (value: boolean, record) => (
        <Checkbox
          checked={value}
          disabled={!canEdit || !record.canRead}
          onChange={(event) =>
            updateScreen(record.screenCode, { canCreate: event.target.checked })
          }
        />
      ),
    },
    {
      title: 'Редактирование',
      dataIndex: 'canUpdate',
      key: 'canUpdate',
      width: 140,
      render: (value: boolean, record) => (
        <Checkbox
          checked={value}
          disabled={!canEdit || !record.canRead}
          onChange={(event) =>
            updateScreen(record.screenCode, { canUpdate: event.target.checked })
          }
        />
      ),
    },
    {
      title: 'Удаление',
      dataIndex: 'canDelete',
      key: 'canDelete',
      width: 110,
      render: (value: boolean, record) => (
        <Checkbox
          checked={value}
          disabled={!canEdit || !record.canRead}
          onChange={(event) =>
            updateScreen(record.screenCode, { canDelete: event.target.checked })
          }
        />
      ),
    },
  ];

  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <Typography.Title level={isMobile ? 4 : 3} style={{ marginTop: 0 }}>
            Настройка доступов
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Для каждой роли задайте доступ к экранам и права CRUD. Чтение включается
            автоматически при доступе к экрану.
          </Typography.Paragraph>
        </div>
        {canEdit && (
          <div className="page-header__actions">
            <Button
              type="primary"
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              Сохранить
            </Button>
          </div>
        )}
      </div>

      <Tabs
        activeKey={activeRole}
        onChange={setActiveRole}
        size={isMobile ? 'small' : 'middle'}
        items={Object.entries(ROLE_LABELS).map(([role, label]) => ({
          key: role,
          label,
          children: (
            <div className="table-card">
              <Table
                rowKey="screenCode"
                columns={columns}
                dataSource={roleScreens}
                loading={matrixQuery.isLoading}
                pagination={false}
                scroll={{ x: isMobile ? 520 : undefined }}
                size={isMobile ? 'small' : 'middle'}
              />
            </div>
          ),
        }))}
      />
    </>
  );
}
