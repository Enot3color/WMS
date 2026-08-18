import { Tabs, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { counterpartiesApi, offersApi } from '../api/counterparties';
import { fetchMaterials } from '../api/materials';
import { referencesApi } from '../api/references';
import { ReferenceCrudTab } from '../components/ReferenceCrudTab';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { COUNTERPARTY_TYPE_LABELS, STATUS_GROUP_LABELS } from '../types/permissions';

type Category = { id: string; name: string; createdAt: string };
type Unit = { id: string; name: string; shortName: string; createdAt: string };
type Counterparty = {
  id: string;
  name: string;
  type: string;
  legalEntity?: string | null;
  contactInfo?: string | null;
  address?: string | null;
  notes?: string | null;
};
type Offer = {
  id: string;
  counterpartyId: string;
  materialId: string;
  price: string;
  deliveryMethod?: string | null;
  supplyStatus?: string | null;
  isPrimary: boolean;
  counterparty: { name: string };
  material: { name: string };
};
type StatusRef = {
  id: string;
  group: string;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

const categoryColumns: ColumnsType<Category> = [
  { title: 'Название', dataIndex: 'name', key: 'name' },
];
const unitColumns: ColumnsType<Unit> = [
  { title: 'Название', dataIndex: 'name', key: 'name' },
  { title: 'Кратко', dataIndex: 'shortName', key: 'shortName' },
];
const counterpartyColumns: ColumnsType<Counterparty> = [
  { title: 'Название', dataIndex: 'name', key: 'name', width: 160 },
  {
    title: 'Тип',
    dataIndex: 'type',
    key: 'type',
    width: 160,
    render: (value: string) => COUNTERPARTY_TYPE_LABELS[value] ?? value,
  },
  { title: 'Юр. лицо', dataIndex: 'legalEntity', key: 'legalEntity', ellipsis: true },
  { title: 'Контакты', dataIndex: 'contactInfo', key: 'contactInfo', ellipsis: true },
];
const offerColumns: ColumnsType<Offer> = [
  { title: 'Контрагент', key: 'cp', render: (_, r) => r.counterparty.name },
  { title: 'Номенклатура', key: 'mat', render: (_, r) => r.material.name },
  { title: 'Цена', dataIndex: 'price', key: 'price', width: 100 },
  { title: 'Поставка', dataIndex: 'deliveryMethod', key: 'deliveryMethod', ellipsis: true },
  { title: 'Статус', dataIndex: 'supplyStatus', key: 'supplyStatus', width: 120 },
  {
    title: 'Основной',
    dataIndex: 'isPrimary',
    key: 'isPrimary',
    width: 100,
    render: (value: boolean) => (value ? 'Да' : 'Нет'),
  },
];
const statusColumns: ColumnsType<StatusRef> = [
  {
    title: 'Группа',
    dataIndex: 'group',
    key: 'group',
    render: (value: string) => STATUS_GROUP_LABELS[value] ?? value,
  },
  { title: 'Код', dataIndex: 'code', key: 'code', width: 140 },
  { title: 'Название', dataIndex: 'label', key: 'label' },
  { title: 'Порядок', dataIndex: 'sortOrder', key: 'sortOrder', width: 100 },
  {
    title: 'Активен',
    dataIndex: 'isActive',
    key: 'isActive',
    width: 100,
    render: (value: boolean) => (value ? 'Да' : 'Нет'),
  },
];

const statusGroupOptions = Object.entries(STATUS_GROUP_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const counterpartyTypeOptions = Object.entries(COUNTERPARTY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function ReferencesPage() {
  const { isMobile } = useBreakpoint();

  return (
    <>
      <Typography.Title level={isMobile ? 4 : 3} style={{ marginTop: 0 }}>
        Справочники
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Контрагенты, прайс-листы, категории, единицы и статусы
      </Typography.Paragraph>

      <Tabs
        size={isMobile ? 'small' : 'middle'}
        tabBarGutter={isMobile ? 8 : 16}
        items={[
          {
            key: 'counterparties',
            label: 'Контрагенты',
            children: (
              <ReferenceCrudTab<Counterparty>
                title="Контрагенты"
                queryKey={['counterparties']}
                listFn={counterpartiesApi.list}
                createFn={(values) =>
                  counterpartiesApi.create({
                    ...values,
                    name: String(values.name),
                  } as Parameters<typeof counterpartiesApi.create>[0])
                }
                updateFn={(id, values) => counterpartiesApi.update(id, values)}
                deleteFn={counterpartiesApi.remove}
                columns={counterpartyColumns}
                fields={[
                  { name: 'name', label: 'Название', required: true },
                  {
                    name: 'type',
                    label: 'Тип',
                    type: 'select',
                    options: counterpartyTypeOptions,
                    required: true,
                  },
                  { name: 'legalEntity', label: 'Юридическое лицо' },
                  { name: 'contactInfo', label: 'Контакты', type: 'textarea' },
                  { name: 'address', label: 'Адрес', type: 'textarea' },
                  { name: 'notes', label: 'Примечания', type: 'textarea' },
                ]}
                createInitialValues={{ type: 'SUPPLIER' }}
              />
            ),
          },
          {
            key: 'offers',
            label: 'Прайс-листы',
            children: <OffersTab />,
          },
          {
            key: 'categories',
            label: 'Категории',
            children: (
              <ReferenceCrudTab<Category>
                title="Категории материалов"
                queryKey={['references', 'categories']}
                listFn={referencesApi.categories.list}
                createFn={(values) => referencesApi.categories.create(values as { name: string })}
                updateFn={(id, values) =>
                  referencesApi.categories.update(id, values as { name?: string })
                }
                deleteFn={referencesApi.categories.remove}
                columns={categoryColumns}
                fields={[{ name: 'name', label: 'Название', required: true }]}
              />
            ),
          },
          {
            key: 'units',
            label: 'Единицы',
            children: (
              <ReferenceCrudTab<Unit>
                title="Единицы измерения"
                queryKey={['references', 'units']}
                listFn={referencesApi.units.list}
                createFn={(values) =>
                  referencesApi.units.create(values as { name: string; shortName: string })
                }
                updateFn={(id, values) =>
                  referencesApi.units.update(id, values as { name?: string; shortName?: string })
                }
                deleteFn={referencesApi.units.remove}
                columns={unitColumns}
                fields={[
                  { name: 'name', label: 'Название', required: true },
                  { name: 'shortName', label: 'Краткое обозначение', required: true },
                ]}
              />
            ),
          },
          {
            key: 'statuses',
            label: 'Статусы',
            children: (
              <ReferenceCrudTab<StatusRef>
                title="Статусы процессов"
                queryKey={['references', 'statuses']}
                listFn={() => referencesApi.statuses.list()}
                createFn={(values) =>
                  referencesApi.statuses.create(
                    values as {
                      group: string;
                      code: string;
                      label: string;
                      sortOrder?: number;
                    },
                  )
                }
                updateFn={(id, values) =>
                  referencesApi.statuses.update(
                    id,
                    values as { label?: string; sortOrder?: number; isActive?: boolean },
                  )
                }
                deleteFn={referencesApi.statuses.remove}
                columns={statusColumns}
                createInitialValues={{ sortOrder: 0, isActive: true }}
                fields={[
                  {
                    name: 'group',
                    label: 'Группа',
                    required: true,
                    type: 'select',
                    options: statusGroupOptions,
                    hiddenOnEdit: true,
                  },
                  {
                    name: 'code',
                    label: 'Код',
                    required: true,
                    placeholder: 'NEW',
                    hiddenOnEdit: true,
                  },
                  { name: 'label', label: 'Название', required: true },
                  { name: 'sortOrder', label: 'Порядок', type: 'number' },
                  { name: 'isActive', label: 'Активен', type: 'switch' },
                ]}
              />
            ),
          },
        ]}
      />
    </>
  );
}

function OffersTab() {
  const counterpartiesQuery = useQuery({
    queryKey: ['counterparties'],
    queryFn: () => counterpartiesApi.list(),
  });
  const materialsQuery = useQuery({
    queryKey: ['materials'],
    queryFn: () => fetchMaterials(),
  });

  return (
    <ReferenceCrudTab<Offer>
      title="Прайс-листы контрагентов"
      queryKey={['counterparty-offers']}
      listFn={offersApi.list}
      createFn={async (values) =>
        offersApi.create({
          counterpartyId: String(values.counterpartyId),
          materialId: String(values.materialId),
          price: Number(values.price ?? 0),
          deliveryMethod: values.deliveryMethod ? String(values.deliveryMethod) : undefined,
          supplyStatus: values.supplyStatus ? String(values.supplyStatus) : undefined,
          isPrimary: Boolean(values.isPrimary),
        })
      }
      updateFn={(id, values) =>
        offersApi.update(id, {
          price: values.price != null ? Number(values.price) : undefined,
          deliveryMethod: values.deliveryMethod ? String(values.deliveryMethod) : undefined,
          supplyStatus: values.supplyStatus ? String(values.supplyStatus) : undefined,
          isPrimary: values.isPrimary as boolean | undefined,
        })
      }
      deleteFn={offersApi.remove}
      columns={offerColumns}
      fields={[
        {
          name: 'counterpartyId',
          label: 'Контрагент',
          type: 'select',
          required: true,
          options: counterpartiesQuery.data?.map((item) => ({ value: item.id, label: item.name })),
        },
        {
          name: 'materialId',
          label: 'Номенклатура',
          type: 'select',
          required: true,
          options: materialsQuery.data?.map((item) => ({ value: item.id, label: item.name })),
        },
        { name: 'price', label: 'Цена', type: 'number', required: true },
        { name: 'deliveryMethod', label: 'Способ поставки', type: 'textarea' },
        { name: 'supplyStatus', label: 'Статус поставки' },
        { name: 'isPrimary', label: 'Основной поставщик', type: 'switch' },
      ]}
      createInitialValues={{ isPrimary: false, price: 0 }}
    />
  );
}
