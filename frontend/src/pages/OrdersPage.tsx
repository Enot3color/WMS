import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMaterials } from '../api/materials';
import { createRequest, fetchRequests } from '../api/requests';
import { usePermissions } from '../auth/PermissionsContext';
import { useBreakpoint, useModalWidth } from '../hooks/useBreakpoint';
import type { ManagerRequestRecord } from '../api/requests';
import { REQUEST_STATUS_LABELS, SCREEN_CODES } from '../types/permissions';

type OrderLineValues = { materialId?: string; quantity?: number };
type OrderFormValues = {
  lines: OrderLineValues[];
  dealNumber?: string;
  clientInfo?: string;
  comment?: string;
  expectedDate?: string;
};

const STATUS_OPTIONS = Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function toDateString(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && 'format' in value) {
    return (value as { format: (token: string) => string }).format('YYYY-MM-DD');
  }
  return undefined;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU');
}

export function OrdersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { isMobile } = useBreakpoint();
  const modalWidth = useModalWidth(820);
  const [form] = Form.useForm<OrderFormValues>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>();
  const [dates, setDates] = useState<[string, string] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const watchedLines = Form.useWatch('lines', form) ?? [];

  const ordersQuery = useQuery({
    queryKey: ['requests', search, status, dates?.[0], dates?.[1]],
    queryFn: () =>
      fetchRequests({
        search: search || undefined,
        status: status || undefined,
        dateFrom: dates?.[0],
        dateTo: dates?.[1],
        activeOnly: !status,
      }),
  });

  const materialsQuery = useQuery({
    queryKey: ['materials'],
    queryFn: () => fetchMaterials(),
  });

  const createMutation = useMutation({
    mutationFn: (values: OrderFormValues) =>
      createRequest({
        lines: (values.lines ?? [])
          .filter((line) => line.materialId && line.quantity)
          .map((line) => ({
            materialId: line.materialId!,
            quantity: line.quantity!,
          })),
        dealNumber: values.dealNumber,
        clientInfo: values.clientInfo,
        comment: values.comment,
        expectedDate: toDateString(values.expectedDate),
      }),
    onSuccess: () => {
      message.success('Заявка создана');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setModalOpen(false);
      form.resetFields();
    },
    onError: () => message.error('Не удалось создать заявку'),
  });

  const columns: ColumnsType<ManagerRequestRecord> = useMemo(
    () => [
      { title: '№', dataIndex: 'number', key: 'number', width: 70 },
      {
        title: 'Дата',
        key: 'createdAt',
        width: 110,
        render: (_, record) => formatDate(record.createdAt),
      },
      {
        title: 'Клиент / заказ',
        dataIndex: 'clientInfo',
        key: 'clientInfo',
        ellipsis: true,
      },
      {
        title: 'Позиций',
        key: 'lines',
        width: 90,
        render: (_, record) => record.lines.length,
      },
      {
        title: 'Срок',
        key: 'expectedDate',
        width: 110,
        render: (_, record) => formatDate(record.expectedDate),
      },
      {
        title: 'Менеджер',
        key: 'manager',
        width: 150,
        render: (_, record) => `${record.manager.firstName} ${record.manager.lastName}`,
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        width: 170,
        render: (value: string) => <Tag>{REQUEST_STATUS_LABELS[value] ?? value}</Tag>,
      },
    ],
    [],
  );

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div className="page-header">
          <div>
            <Typography.Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
              Заявки
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Создание и контроль заявок менеджеров
            </Typography.Paragraph>
          </div>
          {can(SCREEN_CODES.ORDERS, 'create') && (
            <div className="page-header__actions">
              <Button type="primary" onClick={() => setModalOpen(true)}>
                Новая заявка
              </Button>
            </div>
          )}
        </div>

        <Space wrap>
          <Input.Search
            placeholder="Поиск по клиенту, сделке, материалу..."
            allowClear
            onSearch={setSearch}
            style={{ width: isMobile ? '100%' : 320 }}
          />
          <Select
            allowClear
            placeholder="Статус"
            style={{ width: 200 }}
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
          <DatePicker.RangePicker
            onChange={(_values, dateStrings) =>
              setDates(dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : null)
            }
            format="YYYY-MM-DD"
          />
        </Space>

        <div className="table-card">
          <Table
            rowKey="id"
            size={isMobile ? 'small' : 'middle'}
            columns={columns}
            dataSource={ordersQuery.data}
            loading={ordersQuery.isLoading}
            scroll={{ x: 900 }}
            pagination={{ pageSize: 20, ...(isMobile ? { size: 'small' as const } : {}) }}
            onRow={(record) => ({
              onClick: () => navigate(`/orders/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        </div>
      </Space>

      <Modal
        title="Новая заявка"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        okText="Создать"
        cancelText="Отмена"
        width={modalWidth}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ lines: [{ quantity: 1 }] }}
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => {
                  const materialId = watchedLines[index]?.materialId;
                  const material = materialsQuery.data?.find((item) => item.id === materialId);
                  const available = Number(material?.stockBalance?.available ?? 0);
                  return (
                    <Space key={field.key} align="start" style={{ display: 'flex', marginBottom: 8 }} wrap>
                      <Form.Item
                        {...field}
                        name={[field.name, 'materialId']}
                        label={index === 0 ? 'Номенклатура' : ''}
                        rules={[{ required: true, message: 'Выберите позицию' }]}
                        style={{ minWidth: 280, flex: 1 }}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          options={materialsQuery.data?.map((item) => ({
                            value: item.id,
                            label: item.name,
                          }))}
                        />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'quantity']}
                        label={index === 0 ? 'Кол-во' : ''}
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={0.001} style={{ width: 110 }} />
                      </Form.Item>
                      <div style={{ paddingTop: index === 0 ? 30 : 4, minWidth: 90 }}>
                        <Typography.Text type={available <= 0 ? 'danger' : 'secondary'}>
                          На складе: {available}
                          {material ? ` ${material.unit.shortName}` : ''}
                        </Typography.Text>
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(field.name)}
                          style={{ marginTop: index === 0 ? 30 : 4 }}
                        />
                      )}
                    </Space>
                  );
                })}
                <Button type="dashed" onClick={() => add({ quantity: 1 })} icon={<PlusOutlined />} block>
                  Добавить позицию
                </Button>
              </>
            )}
          </Form.List>
          <Form.Item label="Срок выполнения" name="expectedDate" style={{ marginTop: 16 }}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="№ сделки" name="dealNumber">
            <Input />
          </Form.Item>
          <Form.Item label="Клиент, заказ" name="clientInfo">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Комментарий" name="comment">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
