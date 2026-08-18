import { Button, Form, Input, InputNumber, Select, Space, Table, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { counterpartiesApi } from '../api/counterparties';
import { createSupplierOrder, fetchSupplierOrders, previewSupplierOrder, updateSupplierOrder } from '../api/supplierOrders';
import { usePermissions } from '../auth/PermissionsContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { SCREEN_CODES, SUPPLIER_ORDER_STATUS_LABELS } from '../types/permissions';

type FormValues = {
  counterpartyId: string;
  deliveryMethod?: string;
  lines: Array<{ materialId: string; materialName: string; quantity: number; unitPrice: number }>;
};

export function SupplierOrderPage() {
  const [searchParams] = useSearchParams();
  const fromRequest = searchParams.get('fromRequest') ?? undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { isMobile } = useBreakpoint();
  const [form] = Form.useForm<FormValues>();

  const listQuery = useQuery({
    queryKey: ['supplier-orders'],
    queryFn: () => fetchSupplierOrders(),
    enabled: !fromRequest,
  });

  const previewQuery = useQuery({
    queryKey: ['supplier-orders', 'preview', fromRequest],
    queryFn: () => previewSupplierOrder(fromRequest!),
    enabled: Boolean(fromRequest),
  });

  const counterpartiesQuery = useQuery({
    queryKey: ['counterparties'],
    queryFn: () => counterpartiesApi.list(),
  });

  useEffect(() => {
    if (!previewQuery.data) return;
    form.setFieldsValue({
      counterpartyId: previewQuery.data.counterpartyId ?? undefined,
      deliveryMethod: previewQuery.data.deliveryMethod ?? undefined,
      lines: previewQuery.data.lines.map((line) => ({
        materialId: line.materialId,
        materialName: line.materialName,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
    });
  }, [previewQuery.data, form]);

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      createSupplierOrder({
        counterpartyId: values.counterpartyId,
        managerRequestId: fromRequest,
        deliveryMethod: values.deliveryMethod,
        lines: values.lines.map((line) => ({
          materialId: line.materialId,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
        })),
      }),
    onSuccess: () => {
      message.success('Заказ контрагенту создан');
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      navigate(fromRequest ? `/orders/${fromRequest}` : '/supplier-orders');
    },
    onError: () => message.error('Не удалось создать заказ'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateSupplierOrder(id, { status }),
    onSuccess: () => {
      message.success('Статус обновлён');
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });

  if (fromRequest) {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Button type="link" onClick={() => navigate(-1)} style={{ paddingLeft: 0 }}>
            Назад
          </Button>
          <Typography.Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
            Заказ контрагенту по заявке №{previewQuery.data?.requestNumber ?? ''}
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            Контрагент и цены подставляются из основного прайс-листа
          </Typography.Paragraph>
        </div>

        <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item name="counterpartyId" label="Контрагент" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={counterpartiesQuery.data?.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
          </Form.Item>
          <Form.Item name="deliveryMethod" label="Способ поставки">
            <Input />
          </Form.Item>
          <Form.List name="lines">
            {(fields) => (
              <Table
                dataSource={fields}
                rowKey="key"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Номенклатура',
                    render: (_, field) => (
                      <>
                        <Form.Item name={[field.name, 'materialName']} style={{ margin: 0 }}>
                          <Input disabled />
                        </Form.Item>
                        <Form.Item name={[field.name, 'materialId']} hidden>
                          <Input />
                        </Form.Item>
                      </>
                    ),
                  },
                  {
                    title: 'Кол-во',
                    width: 120,
                    render: (_, field) => (
                      <Form.Item name={[field.name, 'quantity']} style={{ margin: 0 }}>
                        <InputNumber min={0.001} style={{ width: '100%' }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: 'Цена',
                    width: 130,
                    render: (_, field) => (
                      <Form.Item name={[field.name, 'unitPrice']} style={{ margin: 0 }}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    ),
                  },
                ]}
              />
            )}
          </Form.List>
          {can(SCREEN_CODES.SUPPLIER_ORDERS, 'create') && (
            <Button type="primary" htmlType="submit" loading={createMutation.isPending} style={{ marginTop: 16 }}>
              Сохранить заказ
            </Button>
          )}
        </Form>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
        Заказы контрагентам
      </Typography.Title>
      <Table
        rowKey="id"
        size="small"
        loading={listQuery.isLoading}
        dataSource={listQuery.data}
        columns={[
          { title: '№', dataIndex: 'number', key: 'number', width: 70 },
          { title: 'Контрагент', key: 'cp', render: (_, r) => r.counterparty.name },
          {
            title: 'Заявка',
            key: 'req',
            render: (_, r) => (r.managerRequest ? `№${r.managerRequest.number}` : '—'),
          },
          {
            title: 'Статус',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record) =>
              can(SCREEN_CODES.SUPPLIER_ORDERS, 'update') ? (
                <Select
                  size="small"
                  value={status}
                  style={{ width: 160 }}
                  options={Object.entries(SUPPLIER_ORDER_STATUS_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  onChange={(value) => statusMutation.mutate({ id: record.id, status: value })}
                />
              ) : (
                SUPPLIER_ORDER_STATUS_LABELS[status] ?? status
              ),
          },
        ]}
      />
    </Space>
  );
}
