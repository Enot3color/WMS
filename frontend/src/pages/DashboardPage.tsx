import { Card, Col, Row, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { usePermissions } from '../auth/PermissionsContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { ROLE_LABELS, formatUserName } from '../types/auth';
import { SCREEN_CODES } from '../types/permissions';

const QUICK_LINKS = [
  { screen: SCREEN_CODES.WAREHOUSE, path: '/warehouse', title: 'Склад', text: 'Заявки, остатки и пополнение' },
  { screen: SCREEN_CODES.ORDERS, path: '/orders', title: 'Заявки', text: 'Создание и статусы заявок менеджеров' },
  { screen: SCREEN_CODES.SUPPLIER_ORDERS, path: '/supplier-orders', title: 'Заказы контрагентам', text: 'Закупки по дефициту' },
  { screen: SCREEN_CODES.MATERIALS, path: '/materials', title: 'Номенклатура', text: 'Справочник материалов' },
  { screen: SCREEN_CODES.REFERENCES, path: '/references', title: 'Справочники', text: 'Контрагенты и прайс-листы' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const { hasScreen } = usePermissions();
  const { isMobile } = useBreakpoint();

  const links = QUICK_LINKS.filter((item) => hasScreen(item.screen));

  return (
    <>
      <Card title="Рабочий стол" size={isMobile ? 'small' : 'default'} style={{ marginBottom: 16 }}>
        <Typography.Paragraph>
          Вы вошли как <strong>{user ? formatUserName(user) : ''}</strong>{' '}
          ({user ? ROLE_LABELS[user.role] : ''})
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Заявка менеджера → проверка остатков кладовщиком → выдача или заказ контрагенту.
        </Typography.Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        {links.map((item) => (
          <Col key={item.path} xs={24} sm={12} lg={8}>
            <Card size={isMobile ? 'small' : 'default'} title={<Link to={item.path}>{item.title}</Link>}>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {item.text}
              </Typography.Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
