import { DocumentBuilder } from '@nestjs/swagger';

export function createSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('MT Euro Stroy API')
    .setDescription(
      'API документация для проекта MT Euro Stroy | Backend NestJS + Prisma + MySQL',
    )
    .setVersion('1.0.0')
    .setContact(
      'MT Euro Stroy',
      'https://mteurstroy.com',
      'info@mteurstroy.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3001', 'Development')
    .addServer('https://api.mteurstroy.com', 'Production')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'bearer',
    )
    .addTag(
      'App',
      'Служебные маршруты приложения. GET / — возвращает "Hello World!"',
    )
    .addTag('Auth', 'Аутентификация и авторизация')
    .addTag('Users', 'Управление пользователями')
    .addTag('Complexes', 'Управление комплексами')
    .addTag('Apartments', 'Управление квартирами')
    .addTag('Bookings', 'Управление бронированиями')
    .addTag('Favourites', 'Избранные квартиры')
    .build();
}

export function reorderSchemas(document: any) {
  if (!document.components || !document.components.schemas) return;

  const entries = Object.entries(document.components.schemas);
  const tagOrder = [
    'App',
    'Auth',
    'Users',
    'Complexes',
    'Apartments',
    'Bookings',
    'Favourites',
  ];
  const entityKeywords: Record<string, string[]> = {
    App: ['App', 'Health', 'Status'],
    Auth: ['Auth', 'Sign', 'Verify', 'Token'],
    Users: ['User'],
    Complexes: ['Complex'],
    Apartments: ['Apartment'],
    Bookings: ['Booking'],
    Favourites: ['Favourite', 'Favorite'],
  };

  const actionOrder = [
    'Create',
    'PublicFindAll',
    'AdminFindAll',
    'FindAll',
    'Get',
    'FindOne',
    'Update',
    'Patch',
    'Delete',
    'Remove',
  ];

  function getEntityIndex(name: string) {
    const lower = name.toLowerCase();
    for (let i = 0; i < tagOrder.length; i++) {
      const tag = tagOrder[i];
      const kws = entityKeywords[tag] || [];
      for (const kw of kws) if (lower.includes(kw.toLowerCase())) return i;
    }
    return tagOrder.length;
  }

  function getActionIndex(name: string) {
    for (let i = 0; i < actionOrder.length; i++) {
      const a = actionOrder[i].toLowerCase();
      if (name.toLowerCase().startsWith(a) || name.toLowerCase().includes(a))
        return i;
    }
    return actionOrder.length;
  }

  entries.sort((a, b) => {
    const nameA = a[0];
    const nameB = b[0];
    const ea = getEntityIndex(nameA);
    const eb = getEntityIndex(nameB);
    if (ea !== eb) return ea - eb;
    const aa = getActionIndex(nameA);
    const ab = getActionIndex(nameB);
    if (aa !== ab) return aa - ab;
    return nameA.localeCompare(nameB);
  });

  const newSchemas: Record<string, any> = {};
  for (const [k, v] of entries) newSchemas[k] = v;
  document.components.schemas = newSchemas;
}

export function getSwaggerOptions() {
  return {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: (a: any, b: any) => {
        const order = [
          'App',
          'Auth',
          'Users',
          'Complexes',
          'Apartments',
          'Bookings',
          'Favourites',
        ];
        try {
          const aName = a.name || a;
          const bName = b.name || b;
          const ia = order.indexOf(aName);
          const ib = order.indexOf(bName);
          if (ia === -1 && ib === -1)
            return String(aName).localeCompare(String(bName));
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        } catch (e) {
          return 0;
        }
      },
      operationsSorter: (a: any, b: any) => {
        try {
          const getPath = (op: any) => {
            if (typeof op.get === 'function') return op.get('path') || '';
            return op.path || '';
          };
          const getMethod = (op: any) => {
            if (typeof op.get === 'function')
              return (op.get('method') || '').toUpperCase();
            return (op.method || '').toUpperCase();
          };

          const aPath = getPath(a);
          const bPath = getPath(b);
          const aMethod = getMethod(a);
          const bMethod = getMethod(b);

          const aIsAdmin = aPath.startsWith('/admin');
          const bIsAdmin = bPath.startsWith('/admin');
          if (aIsAdmin !== bIsAdmin) return aIsAdmin ? 1 : -1;

          const getActionPriority = (path: string, method: string) => {
            const p = path.toLowerCase();
            const hasIdParam = /{id}|{\w+id}/.test(p);
            const isStatusLike = /\/(status|state|type|role|permission)$/.test(
              p,
            );

            if (method === 'POST') return 0;
            if (method === 'GET') {
              if (hasIdParam) return 2;
              return 1;
            }
            if (method === 'PATCH' || method === 'PUT') {
              if (isStatusLike) return 4;
              return 3;
            }
            if (method === 'DELETE') return 5;
            return 6;
          };

          const pa = getActionPriority(aPath, aMethod);
          const pb = getActionPriority(bPath, bMethod);
          if (pa !== pb) return pa - pb;

          return aPath.localeCompare(bPath);
        } catch (e) {
          return 0;
        }
      },
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: 'https://fastapi.tiangolo.com/img/favicon.png',
  };
}
