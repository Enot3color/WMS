import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { createUser, fetchUsers, updateUser } from '../api/users';
import { usePermissions } from '../auth/PermissionsContext';
import { useBreakpoint, useModalWidth } from '../hooks/useBreakpoint';
import { SCREEN_CODES } from '../types/permissions';
import type { UserRole } from '../types/auth';
import { ROLE_LABELS, formatUserName } from '../types/auth';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserRecord,
} from '../types/user';

type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  login: string;
  password?: string;
  role: UserRole;
  isActive?: boolean;
};

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as UserRole[]).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

function formatDate(value: string) {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPhone(phone: string) {
  if (phone.length === 11 && phone.startsWith('7')) {
    return `+7 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9, 11)}`;
  }

  return phone;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { isMobile } = useBreakpoint();
  const modalWidth = useModalWidth(560);
  const [form] = Form.useForm<UserFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      message.success('Пользователь создан');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: () => message.error('Не удалось создать пользователя'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      updateUser(id, data),
    onSuccess: () => {
      message.success('Пользователь обновлён');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: () => message.error('Не удалось обновить пользователя'),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const canCreate = can(SCREEN_CODES.USERS, 'create');
  const canUpdate = can(SCREEN_CODES.USERS, 'update');

  const columns: ColumnsType<UserRecord> = useMemo(
    () => [
      {
        title: 'Фамилия',
        dataIndex: 'lastName',
        key: 'lastName',
      },
      {
        title: 'Имя',
        dataIndex: 'firstName',
        key: 'firstName',
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
      },
      {
        title: 'Телефон',
        dataIndex: 'phone',
        key: 'phone',
        render: formatPhone,
      },
      {
        title: 'Логин',
        dataIndex: 'login',
        key: 'login',
      },
      {
        title: 'Роль',
        dataIndex: 'role',
        key: 'role',
        render: (role: UserRole) => ROLE_LABELS[role],
      },
      {
        title: 'Статус',
        dataIndex: 'isActive',
        key: 'isActive',
        render: (isActive: boolean) =>
          isActive ? (
            <Tag color="green">Активен</Tag>
          ) : (
            <Tag color="default">Отключён</Tag>
          ),
      },
      {
        title: 'Создан',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: formatDate,
      },
      {
        title: '',
        key: 'actions',
        width: 120,
        render: (_, record) =>
          canUpdate ? (
            <Button type="link" onClick={() => openEditModal(record)}>
              Изменить
            </Button>
          ) : null,
      },
    ],
    [canUpdate],
  );

  function openCreateModal() {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: 'MANAGER', isActive: true });
    setModalOpen(true);
  }

  function openEditModal(user: UserRecord) {
    setEditingUser(user);
    form.setFieldsValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      login: user.login,
      role: user.role,
      isActive: user.isActive,
      password: '',
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  }

  async function handleSubmit(values: UserFormValues) {
    if (editingUser) {
      const payload: UpdateUserRequest = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        login: values.login,
        role: values.role,
        isActive: values.isActive,
      };

      if (values.password?.trim()) {
        payload.password = values.password;
      }

      await updateMutation.mutateAsync({ id: editingUser.id, data: payload });
      return;
    }

    const payload: CreateUserRequest = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      login: values.login,
      password: values.password!,
      role: values.role,
    };

    await createMutation.mutateAsync(payload);
  }

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div className="page-header">
          <div>
            <Typography.Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
              Пользователи
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Имя, фамилия, email, телефон, логин и роль доступа
            </Typography.Paragraph>
          </div>
          <div className="page-header__actions">
            <Button type="primary" onClick={openCreateModal} disabled={!canCreate}>
              Добавить пользователя
            </Button>
          </div>
        </div>

        <div className="table-card">
          <Table
            rowKey="id"
            columns={columns}
            dataSource={usersQuery.data}
            loading={usersQuery.isLoading}
            pagination={{ pageSize: 10, showSizeChanger: false, ...(isMobile ? { size: 'small' as const } : {}) }}
            scroll={{ x: isMobile ? 960 : 1100 }}
            size={isMobile ? 'small' : 'middle'}
          />
        </div>
      </Space>

      <Modal
        title={editingUser ? `Редактирование: ${formatUserName(editingUser)}` : 'Новый пользователь'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={isSaving}
        okText={editingUser ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        destroyOnHidden
        width={modalWidth}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <div className="form-grid-2">
            <Form.Item
              label="Имя"
              name="firstName"
              rules={[
                { required: true, message: 'Введите имя' },
                { min: 2, message: 'Минимум 2 символа' },
              ]}
            >
              <Input placeholder="Иван" />
            </Form.Item>

            <Form.Item
              label="Фамилия"
              name="lastName"
              rules={[
                { required: true, message: 'Введите фамилию' },
                { min: 2, message: 'Минимум 2 символа' },
              ]}
            >
              <Input placeholder="Менеджеров" />
            </Form.Item>
          </div>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <Form.Item
            label="Телефон"
            name="phone"
            rules={[
              { required: true, message: 'Введите телефон' },
              { min: 10, message: 'Минимум 10 цифр' },
            ]}
          >
            <Input placeholder="+7 900 123-45-67" />
          </Form.Item>

          <Form.Item
            label="Логин"
            name="login"
            rules={[
              { required: true, message: 'Введите логин' },
              { min: 3, message: 'Минимум 3 символа' },
              {
                pattern: /^[a-zA-Z0-9._-]+$/,
                message: 'Только латиница, цифры, ".", "_" и "-"',
              },
            ]}
          >
            <Input placeholder="ivan.manager" />
          </Form.Item>

          <Form.Item
            label="Роль"
            name="role"
            rules={[{ required: true, message: 'Выберите роль' }]}
          >
            <Select options={ROLE_OPTIONS} />
          </Form.Item>

          <Form.Item
            label={editingUser ? 'Новый пароль' : 'Пароль'}
            name="password"
            rules={
              editingUser
                ? [{ min: 8, message: 'Минимум 8 символов' }]
                : [
                    { required: true, message: 'Введите пароль' },
                    { min: 8, message: 'Минимум 8 символов' },
                  ]
            }
          >
            <Input.Password
              placeholder={editingUser ? 'Оставьте пустым, чтобы не менять' : '••••••••'}
            />
          </Form.Item>

          {editingUser && (
            <Form.Item
              label="Активен"
              name="isActive"
              valuePropName="checked"
            >
              <Switch checkedChildren="Да" unCheckedChildren="Нет" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
