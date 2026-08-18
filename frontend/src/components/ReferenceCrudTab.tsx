import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { usePermissions } from '../auth/PermissionsContext';
import { useBreakpoint, useModalWidth } from '../hooks/useBreakpoint';
import { SCREEN_CODES } from '../types/permissions';

type FieldConfig = {
  name: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'number' | 'switch' | 'select' | 'textarea';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  hiddenOnEdit?: boolean;
};

interface ReferenceCrudTabProps<T extends { id: string }> {
  title: string;
  queryKey: string[];
  listFn: () => Promise<T[]>;
  createFn: (values: Record<string, unknown>) => Promise<unknown>;
  updateFn: (id: string, values: Record<string, unknown>) => Promise<unknown>;
  deleteFn: (id: string) => Promise<unknown>;
  columns: ColumnsType<T>;
  fields: FieldConfig[];
  createInitialValues?: Record<string, unknown>;
}

export function ReferenceCrudTab<T extends { id: string }>({
  title,
  queryKey,
  listFn,
  createFn,
  updateFn,
  deleteFn,
  columns,
  fields,
  createInitialValues,
}: ReferenceCrudTabProps<T>) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { isMobile } = useBreakpoint();
  const modalWidth = useModalWidth();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  const canCreate = can(SCREEN_CODES.REFERENCES, 'create');
  const canUpdate = can(SCREEN_CODES.REFERENCES, 'update');
  const canDelete = can(SCREEN_CODES.REFERENCES, 'delete');

  const query = useQuery({
    queryKey,
    queryFn: listFn,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      if (editing) {
        return updateFn(editing.id, values);
      }
      return createFn(values);
    },
    onSuccess: () => {
      message.success(editing ? 'Запись обновлена' : 'Запись создана');
      queryClient.invalidateQueries({ queryKey });
      closeModal();
    },
    onError: () => message.error('Не удалось сохранить запись'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      message.success('Запись удалена');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => message.error('Не удалось удалить запись'),
  });

  const tableColumns = useMemo(() => {
    if (!canUpdate && !canDelete) {
      return columns;
    }

    return [
      ...columns,
      {
        title: '',
        key: 'actions',
        width: 180,
        render: (_: unknown, record: T) => (
          <Space>
            {canUpdate && (
              <Button type="link" onClick={() => openEdit(record)}>
                Изменить
              </Button>
            )}
            {canDelete && (
              <Popconfirm
                title="Удалить запись?"
                onConfirm={() => deleteMutation.mutate(record.id)}
              >
                <Button type="link" danger>
                  Удалить
                </Button>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ] as ColumnsType<T>;
  }, [canUpdate, canDelete, columns, deleteMutation]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    if (createInitialValues) {
      form.setFieldsValue(createInitialValues);
    }
    setOpen(true);
  }

  function openEdit(record: T) {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  }

  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <strong>{title}</strong>
        {canCreate && (
          <div className="page-header__actions">
            <Button type="primary" onClick={openCreate}>
              Добавить
            </Button>
          </div>
        )}
      </div>

      <div className="table-card">
        <Table
          rowKey="id"
          columns={tableColumns}
          dataSource={query.data}
          loading={query.isLoading}
          pagination={{ pageSize: 10, showSizeChanger: false, ...(isMobile ? { size: 'small' as const } : {}) }}
          scroll={{ x: isMobile ? 'max-content' : undefined }}
          size={isMobile ? 'small' : 'middle'}
        />
      </div>

      <Modal
        title={editing ? `Редактирование — ${title}` : `Новая запись — ${title}`}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        okText={editing ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        destroyOnHidden
        width={modalWidth}
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          {fields
            .filter((field) => !(editing && field.hiddenOnEdit))
            .map((field) => (
            <Form.Item
              key={field.name}
              label={field.label}
              name={field.name}
              valuePropName={field.type === 'switch' ? 'checked' : 'value'}
              rules={
                field.required
                  ? [{ required: true, message: `Укажите ${field.label.toLowerCase()}` }]
                  : undefined
              }
            >
              {renderField(field)}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </>
  );
}

function renderField(field: FieldConfig): ReactNode {
  if (field.type === 'select') {
    return <Select options={field.options} />;
  }

  if (field.type === 'number') {
    return <InputNumber style={{ width: '100%' }} />;
  }

  if (field.type === 'switch') {
    return <Switch checkedChildren="Да" unCheckedChildren="Нет" />;
  }

  if (field.type === 'textarea') {
    return <Input.TextArea rows={3} placeholder={field.placeholder} />;
  }

  return <Input placeholder={field.placeholder} />;
}
