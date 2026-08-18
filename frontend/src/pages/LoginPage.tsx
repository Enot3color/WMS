import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useBreakpoint } from '../hooks/useBreakpoint';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { identifier: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      message.success('Вход выполнен');
      navigate('/');
    } catch {
      message.error('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#f5f5f5',
        padding: 16,
      }}
    >
      <Card
        style={{ width: '100%', maxWidth: 420 }}
        styles={{ body: { padding: isMobile ? 16 : 24 } }}
      >
        <Typography.Title level={isMobile ? 4 : 3} style={{ marginTop: 0 }}>
          Складской учёт
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Войдите по email, телефону или логину
        </Typography.Paragraph>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label="Email, телефон или логин"
            name="identifier"
            rules={[{ required: true, message: 'Введите email, телефон или логин' }]}
          >
            <Input
              placeholder="admin / admin@example.com / +79000000000"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password placeholder="••••••••" autoComplete="current-password" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loading}>
            Войти
          </Button>
        </Form>
      </Card>
    </div>
  );
}
