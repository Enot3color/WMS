import { Button, Card, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchWarehouseDashboard } from '../api/warehouse';
import type { ManagerRequestRecord } from '../api/requests';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { REQUEST_STATUS_LABELS } from '../types/permissions';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU');
}

export function WarehousePage() {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  const dashboardQuery = useQuery({
    queryKey: ['warehouse', 'dashboard'],
    queryFn: fetchWarehouseDashboard,
    refetchInterval: 15000,
  });

  const requestColumns: ColumnsType<ManagerRequestRecord> = [
    { title: '№', dataIndex: 'number', key: 'number', width: 70 },
    {
      title: 'Дата',
      key: 'createdAt',
      width: 110,
      render: (_, record) => formatDate(record.createdAt),
    },
    {
      title: 'Клиент',
      dataIndex: 'clientInfo',
      key: 'clientInfo',
      ellipsis: true,
    },
    {
      title: 'Срок',
      key: 'expectedDate',
      width: 110,
      render: (_, record) => (
        <Typography.Text type={record.overdue ? 'danger' : undefined}>
          {formatDate(record.expectedDate)}
        </Typography.Text>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status: string, record) => (
        <Space>
          {record.isNew && <Tag color="blue">Новая</Tag>}
          <Tag color={record.overdue ? 'red' : undefined}>
            {REQUEST_STATUS_LABELS[status] ?? status}
          </Tag>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
          Рабочий стол кладовщика
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Текущие заявки и номенклатура к пополнению
        </Typography.Paragraph>
      </div>

      <Card title="Заявки" size={isMobile ? 'small' : 'default'}>
        <Table
          rowKey="id"
          size="small"
          columns={requestColumns}
          dataSource={dashboardQuery.data?.requests}
          loading={dashboardQuery.isLoading}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => navigate(`/orders/${record.id}`),
            style: {
              cursor: 'pointer',
              background: record.isNew ? '#e6f4ff' : record.overdue ? '#fff1f0' : undefined,
            },
          })}
        />
      </Card>

      <Card title="Необходимо пополнить" size={isMobile ? 'small' : 'default'}>
        <Table
          rowKey="id"
          size="small"
          dataSource={dashboardQuery.data?.replenishment}
          loading={dashboardQuery.isLoading}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: 'Номенклатура', dataIndex: 'name', key: 'name' },
            { title: 'Категория', key: 'category', render: (_, r) => r.category.name },
            { title: 'На складе', dataIndex: 'available', key: 'available', width: 110 },
            { title: 'Мин.', dataIndex: 'min', key: 'min', width: 90 },
            { title: 'Дефицит', dataIndex: 'deficit', key: 'deficit', width: 100 },
          ]}
        />
        <Button
          type="link"
          style={{ paddingLeft: 0, marginTop: 8 }}
          onClick={() => navigate('/supplier-orders/new')}
        >
          Сформировать заказ контрагенту
        </Button>
      </Card>
    </Space>
  );
}
