import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { createMaterial, deleteMaterial, fetchMaterials, updateMaterial } from '../api/materials';
import { referencesApi } from '../api/references';
import { usePermissions } from '../auth/PermissionsContext';
import { useBreakpoint, useModalWidth } from '../hooks/useBreakpoint';
import type { MaterialRecord } from '../types/material';
import { SCREEN_CODES } from '../types/permissions';

type ReferenceItem = { id: string; name: string; shortName?: string };

type MaterialFormValues = {
  name: string;
  categoryId: string;
  unitId: string;
  series?: string;
  color?: string;
  densityGsm?: number;
  thicknessMicron?: number;
  texture?: string;
  coating?: string;
  dimensions?: string;
  description?: string;
  minStock?: number;
  purchaseBatch?: number;
};

function formatQty(value?: string | null) {
  if (value == null) return '0';
  const num = Number(value);
  return Number.isFinite(num) ? String(num) : value;
}

export function MaterialsPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { isMobile } = useBreakpoint();
  const modalWidth = useModalWidth(720);
  const [form] = Form.useForm<MaterialFormValues>();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialRecord | null>(null);

  const materialsQuery = useQuery({
    queryKey: ['materials', search],
    queryFn: () => fetchMaterials({ search: search || undefined }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['references', 'categories'],
    queryFn: () => referencesApi.categories.list() as Promise<ReferenceItem[]>,
  });

  const unitsQuery = useQuery({
    queryKey: ['references', 'units'],
    queryFn: () => referencesApi.units.list() as Promise<ReferenceItem[]>,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: MaterialFormValues) => {
      if (editing) {
        return updateMaterial(editing.id, values);
      }
      return createMaterial(values);
    },
    onSuccess: () => {
      message.success(editing ? 'Материал обновлён' : 'Материал создан');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      closeModal();
    },
    onError: () => message.error('Не удалось сохранить материал'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      message.success('Материал удалён');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: () => message.error('Не удалось удалить материал'),
  });

  const columns: ColumnsType<MaterialRecord> = useMemo(
    () => [
      { title: 'Название', dataIndex: 'name', key: 'name', fixed: isMobile ? undefined : 'left', width: 220 },
      { title: 'Категория', key: 'category', render: (_, r) => r.category.name, width: 160 },
      { title: 'Серия', dataIndex: 'series', key: 'series', width: 120 },
      { title: 'Цвет', dataIndex: 'color', key: 'color', width: 100 },
      { title: 'Плотность', dataIndex: 'densityGsm', key: 'densityGsm', width: 90 },
      { title: 'Размеры', dataIndex: 'dimensions', key: 'dimensions', width: 110 },
      { title: 'Ед.', key: 'unit', render: (_, r) => r.unit.shortName, width: 60 },
      {
        title: 'Контрагент',
        key: 'offer',
        width: 140,
        render: (_, r) => r.offers?.find((item) => item.isPrimary)?.counterparty.name ?? '—',
      },
      {
        title: 'Склад',
        key: 'available',
        width: 80,
        render: (_, r) => formatQty(r.stockBalance?.available),
      },
      {
        title: 'Мин',
        key: 'minStock',
        width: 70,
        render: (_, r) => formatQty(r.minStock),
      },
      {
        title: '',
        key: 'actions',
        width: 140,
        render: (_, record) => (
          <Space size={0}>
            {can(SCREEN_CODES.MATERIALS, 'update') && (
              <Button type="link" onClick={() => openEdit(record)}>
                Изменить
              </Button>
            )}
            {can(SCREEN_CODES.MATERIALS, 'delete') && (
              <Popconfirm title="Удалить материал?" onConfirm={() => deleteMutation.mutate(record.id)}>
                <Button type="link" danger>
                  Удалить
                </Button>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [can, deleteMutation, isMobile],
  );

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(record: MaterialRecord) {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      categoryId: record.categoryId,
      unitId: record.unitId,
      series: record.series ?? undefined,
      color: record.color ?? undefined,
      densityGsm: record.densityGsm ?? undefined,
      thicknessMicron: record.thicknessMicron ?? undefined,
      texture: record.texture ?? undefined,
      coating: record.coating ?? undefined,
      dimensions: record.dimensions ?? undefined,
      description: record.description ?? undefined,
      minStock: record.minStock ? Number(record.minStock) : undefined,
      purchaseBatch: record.purchaseBatch ? Number(record.purchaseBatch) : undefined,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  }

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div className="page-header">
          <div>
            <Typography.Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
              Номенклатура
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Материалы со свойствами из таблицы «Материалы»
            </Typography.Paragraph>
          </div>
          {can(SCREEN_CODES.MATERIALS, 'create') && (
            <div className="page-header__actions">
              <Button type="primary" onClick={openCreate}>
                Добавить материал
              </Button>
            </div>
          )}
        </div>

        <Input.Search
          placeholder="Поиск по названию, серии, цвету..."
          allowClear
          onSearch={setSearch}
          style={{ maxWidth: isMobile ? '100%' : 420 }}
        />

        <div className="table-card">
          <Table
            rowKey="id"
            size={isMobile ? 'small' : 'middle'}
            columns={columns}
            dataSource={materialsQuery.data}
            loading={materialsQuery.isLoading}
            scroll={{ x: 1400 }}
            pagination={{ pageSize: 20, ...(isMobile ? { size: 'small' as const } : {}) }}
          />
        </div>
      </Space>

      <Modal
        title={editing ? 'Редактирование материала' : 'Новый материал'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        okText={editing ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        width={modalWidth}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          <Form.Item label="Название" name="name" rules={[{ required: true, message: 'Введите название' }]}>
            <Input />
          </Form.Item>
          <div className="form-grid-2">
            <Form.Item label="Категория" name="categoryId" rules={[{ required: true }]}>
              <Select
                options={categoriesQuery.data?.map((item) => ({ value: item.id, label: item.name }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item label="Единица" name="unitId" rules={[{ required: true }]}>
              <Select
                options={unitsQuery.data?.map((item) => ({
                  value: item.id,
                  label: `${item.name} (${item.shortName})`,
                }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </div>
          <div className="form-grid-2">
            <Form.Item label="Серия" name="series">
              <Input />
            </Form.Item>
            <Form.Item label="Цвет" name="color">
              <Input />
            </Form.Item>
          </div>
          <div className="form-grid-2">
            <Form.Item label="Плотность, г/м²" name="densityGsm">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Толщина, мкм" name="thicknessMicron">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div className="form-grid-2">
            <Form.Item label="Фактура" name="texture">
              <Input />
            </Form.Item>
            <Form.Item label="Покрытие" name="coating">
              <Input />
            </Form.Item>
          </div>
          <Form.Item label="Размеры, мм" name="dimensions">
            <Input placeholder="320x450" />
          </Form.Item>
          <Form.Item label="Описание" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <div className="form-grid-2">
            <Form.Item label="Мин. остаток" name="minStock">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item label="Партия закупки" name="purchaseBatch">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}
