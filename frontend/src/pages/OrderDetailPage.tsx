import { Button, Descriptions, Space, Table, Tag, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchRequestAvailability,
  issueRequest,
  markRequestSeen,
} from '../api/requests';
import { usePermissions } from '../auth/PermissionsContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { REQUEST_STATUS_LABELS, SCREEN_CODES } from '../types/permissions';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU');
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can, hasScreen } = usePermissions();
  const { isMobile } = useBreakpoint();

  const availabilityQuery = useQuery({
    queryKey: ['requests', id, 'availability'],
    queryFn: () => fetchRequestAvailability(id!),
    enabled: Boolean(id),
  });

  const seenMutation = useMutation({
    mutationFn: () => markRequestSeen(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
    },
  });

  const issueMutation = useMutation({
    mutationFn: () => issueRequest(id!),
    onSuccess: () => {
      message.success('Выдача оформлена');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: () => message.error('Нельзя оформить выдачу: проверьте остатки'),
  });

  useEffect(() => {
    if (id && can(SCREEN_CODES.WAREHOUSE, 'update') && availabilityQuery.data) {
      const request = availabilityQuery.data.request;
      if (request.status === 'SUBMITTED' || !request.warehouseSeenAt) {
        seenMutation.mutate();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, availabilityQuery.data?.request.id]);

  const data = availabilityQuery.data;
  const request = data?.request;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div className="page-header">
        <div>
          <Button type="link" onClick={() => navigate(-1)} style={{ paddingLeft: 0 }}>
            Назад
          </Button>
          <Typography.Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
            Заявка №{request?.number ?? ''}
          </Typography.Title>
        </div>
        <Space wrap>
          {can(SCREEN_CODES.WAREHOUSE, 'create') && (
            <Button
              type="primary"
              disabled={!data?.canIssue}
              loading={issueMutation.isPending}
              onClick={() => issueMutation.mutate()}
            >
              Сформировать выдачу
            </Button>
          )}
          {hasScreen(SCREEN_CODES.SUPPLIER_ORDERS) && data?.hasShortage && (
            <Button onClick={() => navigate(`/supplier-orders/new?fromRequest=${id}`)}>
              Заказать у контрагента
            </Button>
          )}
        </Space>
      </div>

      {request && (
        <Descriptions bordered size="small" column={isMobile ? 1 : 3}>
          <Descriptions.Item label="Статус">
            <Tag>{REQUEST_STATUS_LABELS[request.status] ?? request.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Дата">{formatDate(request.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Срок">{formatDate(request.expectedDate)}</Descriptions.Item>
          <Descriptions.Item label="Менеджер">
            {request.manager.firstName} {request.manager.lastName}
          </Descriptions.Item>
          <Descriptions.Item label="Клиент" span={2}>
            {request.clientInfo || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Комментарий" span={3}>
            {request.comment || '—'}
          </Descriptions.Item>
        </Descriptions>
      )}

      <Table
        rowKey="lineId"
        size="small"
        loading={availabilityQuery.isLoading}
        dataSource={data?.lines}
        pagination={false}
        rowClassName={(row) => (row.shortage > 0 ? 'row-shortage' : '')}
        columns={[
          { title: 'Номенклатура', dataIndex: 'materialName', key: 'materialName' },
          { title: 'Нужно', dataIndex: 'required', key: 'required', width: 100 },
          { title: 'На складе', dataIndex: 'available', key: 'available', width: 110 },
          {
            title: 'Дефицит',
            dataIndex: 'shortage',
            key: 'shortage',
            width: 110,
            render: (value: number) =>
              value > 0 ? <Typography.Text type="danger">{value}</Typography.Text> : '0',
          },
          { title: 'Ед.', dataIndex: 'unit', key: 'unit', width: 70 },
        ]}
      />
    </Space>
  );
}
