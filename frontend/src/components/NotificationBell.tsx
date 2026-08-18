import { Badge, Button, Dropdown, Empty, List, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications';

function playAlert() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 880;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.25);
}

export function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const previousCount = useRef<number | null>(null);

  const countQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const listQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const count = countQuery.data?.count ?? 0;

  useEffect(() => {
    if (previousCount.current != null && count > previousCount.current) {
      playAlert();
    }
    previousCount.current = count;
  }, [count]);

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <Dropdown
      trigger={['click']}
      popupRender={() => (
        <div
          style={{
            width: 320,
            maxHeight: 420,
            overflow: 'auto',
            background: '#fff',
            boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
            borderRadius: 8,
            padding: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px' }}>
            <Typography.Text strong>Уведомления</Typography.Text>
            <Button type="link" size="small" onClick={() => readAllMutation.mutate()}>
              Прочитать все
            </Button>
          </div>
          {listQuery.data?.length ? (
            <List
              size="small"
              dataSource={listQuery.data.slice(0, 20)}
              renderItem={(item) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background: item.readAt ? undefined : '#e6f4ff',
                    padding: 8,
                  }}
                  onClick={() => {
                    readMutation.mutate(item.id);
                    if (item.entityType === 'ManagerRequest' && item.entityId) {
                      navigate(`/orders/${item.entityId}`);
                    }
                  }}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <>
                        <div>{item.message}</div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(item.createdAt).toLocaleString('ru-RU')}
                        </Typography.Text>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Нет уведомлений" />
          )}
        </div>
      )}
    >
      <Badge count={count} size="small">
        <Button type="text" icon={<BellOutlined />} aria-label="Уведомления" />
      </Badge>
    </Dropdown>
  );
}
