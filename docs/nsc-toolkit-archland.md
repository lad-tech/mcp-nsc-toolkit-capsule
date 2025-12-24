# ArchLand: Система документирования архитектуры для nsc-toolkit

## Назначение ArchLand

ArchLand решает проблему потери контроля над сложными распределенными системами, построенными на nsc-toolkit. Когда приложение разрастается, становится сложно отслеживать:

- Какие события какие сервисы обрабатывают
- Какие методы сервисы вызывают друг у друга  
- Какие реализации используются для репозиториев
- Как связаны компоненты системы

**Решение:** Файл `archland.json` в корне проекта, который автоматически генерируется на основе кода и содержит полную карту архитектуры.

**Использование:** Визуализация архитектуры через C4-диаграммы (контейнерная и компонентная диаграммы в формате PlantUML).

## Структура archland.json

### Общие правила генерации:

1. **Расположение:** Всегда в корне проекта
2. **Формат:** Строгое соответствие JSON Schema
3. **Генерация:** Автоматическая на основе анализа кода сервисов

```json
{
  "format": "1.0",
  "name": "MathCalculationSystem",
  "description": "Система для математических расчетов и анализа",
  "version": "1.0.0",
  "services": {
    "MathService": {
      "describePath": "services/MathService/service.schema.json",
      "description": "Сервис базовых математических операций",
      "folderPath": "services/MathService/",
      "dependencies": {
        "TYPES.Repository": {
          "shared": false,
          "className": "PostgresRepository",
          "classPath": "./repository/PostgresRepository/index.ts",
          "type": "dbms",
          "external": false,
          "dependencies": {
            "TYPES.Config": {
              "shared": false,
              "className": "Object",
              "classPath": "",
              "type": "constant",
              "external": false
            }
          }
        },
        "TYPES.AuthService": {
          "shared": true,
          "className": "AuthClient",
          "classPath": "../AuthService/index.ts",
          "type": "service",
          "external": false
        }
      },
      "methods": {
        "Sum": {
          "description": "Сложение двух чисел",
          "trigger": ["CalculationElapsed"],
          "calls": [
            {
              "dependencyKey": "TYPES.Repository",
              "method": "saveCalculation"
            }
          ]
        },
        "ComplexCalculation": {
          "description": "Сложный математический расчет",
          "trigger": ["CalculationStarted", "CalculationFinished"],
          "calls": [
            {
              "dependencyKey": "TYPES.AuthService", 
              "method": "validateToken"
            },
            {
              "dependencyKey": "TYPES.Repository",
              "method": "getHistoricalData"
            }
          ]
        }
      },
      "subscriptions": [
        {
          "from": "AuthService",
          "event": "UserLoggedIn", 
          "dependencyKey": "TYPES.AuthProcessing",
          "calls": [
            {
              "dependencyKey": "TYPES.Repository",
              "method": "updateUserSession"
            }
          ],
          "trigger": ["UserSessionUpdated"]
        }
      ]
    },
    "AuthService": {
      "describePath": "services/AuthService/service.schema.json",
      "description": "Сервис аутентификации и авторизации",
      "folderPath": "services/AuthService/",
      "dependencies": {
        "TYPES.UserRepository": {
          "shared": false,
          "className": "MongoUserRepository",
          "classPath": "./repository/MongoUserRepository/index.ts",
          "type": "dbms", 
          "external": false
        }
      },
      "methods": {
        "ValidateToken": {
          "description": "Валидация JWT токена",
          "trigger": ["TokenValidated"],
          "calls": [
            {
              "dependencyKey": "TYPES.UserRepository",
              "method": "findUserByToken"
            }
          ]
        }
      },
      "subscriptions": []
    }
  }
}
```

## Детальные правила генерации для каждого компонента

### 1. Сервис (Service)

**Правила заполнения:**
- `describePath`: относительный путь от корня проекта к `service.schema.json`
- `description`: берется из `service.schema.json` → `description`
- `folderPath`: относительный путь к каталогу сервиса
- `dependencies`: анализируется DI-контейнер из `service.ts`

```typescript
// Пример: service.ts
container.bind<RepositoryPort>(TYPES.Repository, DependencyType.ADAPTER, PostgresRepository, {
  singleton: true,
  tag: { location: 'internal', type: 'dbms', name: 'postgres', target: 'calculations' }
});
```

**Преобразуется в:**
```json
"TYPES.Repository": {
  "shared": false,
  "className": "PostgresRepository", 
  "classPath": "./repository/PostgresRepository/index.ts",
  "type": "dbms",
  "external": false,
  "dependencies": {}
}
```

### 2. Зависимости (Dependency)

**Правила определения полей:**

- `shared`: 
  - `true` - если класс находится вне каталога текущего сервиса
  - `false` - если внутри каталога сервиса

- `className`: имя класса из привязки DI-контейнера

- `classPath`: 
  - Если `shared: false` - относительный путь от каталога сервиса
  - Если `shared: true` - относительный путь от корня сервисов

- `type`: берется из тэга DI → `tag.type` (например, "dbms", "api", "service")

- `external`: берется из тэга DI → `tag.location === 'external'`

- `dependencies`: рекурсивный анализ зависимостей класса через конструктор

### 3. Методы (Method)

**Источник данных:** Классы методов в `methods/` каталоге

**Правила анализа:**
- `description`: из `service.schema.json` → `methods.{MethodName}.description`
- `trigger`: анализ вызовов `this.emitter.*` в коде метода
- `calls`: анализ вызовов зависимостей через `this.*` в коде метода

```typescript
// Пример: methods/Sum/index.ts
public async handler(request: SumRequest): Promise<SumResponse> {
  // Анализ: вызов метода saveCalculation у зависимости TYPES.Repository
  await this.repository.saveCalculation(request);
  
  // Анализ: генерация события CalculationElapsed
  this.emitter.CalculationElapsed({ elapsed: 150 });
  
  return { result: request.a + request.b };
}
```

**Преобразуется в:**
```json
"Sum": {
  "description": "Сложение двух чисел",
  "trigger": ["CalculationElapsed"],
  "calls": [
    {
      "dependencyKey": "TYPES.Repository",
      "method": "saveCalculation"
    }
  ]
}
```

### 4. Подписки (Subscription)

**Источник данных:** Классы обработчиков в `processing/` каталоге

**Правила анализа:**
- `from`: из клиента сервиса, переданного в `start()` метод обработчика
- `event`: из вызова `listener.on('EventName', ...)`
- `dependencyKey`: ключ DI, по которому привязан класс обработчика
- `calls`: анализ вызовов в обработчике события
- `trigger`: анализ генерации событий в обработчике

```typescript
// Пример: processing/AuthProcessing/index.ts
export class AuthProcessing {
  constructor(
    @inject(TYPES.Repository) private repository: RepositoryPort
  ) {}

  private async onUserLoggedIn(event: { data: { userId: string }; ack: () => void }) {
    // Анализ: вызов метода updateUserSession
    await this.repository.updateUserSession(event.data.userId);
    
    // Анализ: генерация события (если бы был emitter)
    // this.emitter.UserSessionUpdated({ userId: event.data.userId });
  }

  public start(authService: AuthClient) {
    // Анализ: подписка на событие UserLoggedIn от AuthService
    this.listener = authService.getListener('MathService', { deliver: 'new' });
    this.listener.on('UserLoggedIn', this.onUserLoggedIn.bind(this));
  }
}
```

**Преобразуется в:**
```json
{
  "from": "AuthService",
  "event": "UserLoggedIn",
  "dependencyKey": "TYPES.AuthProcessing", 
  "calls": [
    {
      "dependencyKey": "TYPES.Repository",
      "method": "updateUserSession"
    }
  ],
  "trigger": []
}
```

## Алгоритм генерации для LLM

### Шаг 1: Анализ структуры проекта
```
PROJECT_ROOT/
├── services/
│   ├── ServiceA/
│   │   ├── service.schema.json
│   │   ├── service.ts
│   │   ├── methods/
│   │   ├── processing/
│   │   └── repository/
│   └── ServiceB/
│       ├── service.schema.json
│       ├── service.ts
│       ├── methods/
│       ├── processing/
│       └── repository/
└── archland.json
```

### Шаг 2: Для каждого сервиса собрать информацию

1. **Базовая информация:**
   - Прочитать `service.schema.json` → `name`, `description`
   - Записать пути: `describePath`, `folderPath`

2. **Анализ DI-контейнера:**
   - Прочитать `service.ts`
   - Для каждой `container.bind()` создать Dependency объект
   - Проанализировать тэги для `type` и `external`

3. **Анализ методов:**
   - Для каждого класса в `methods/` каталоге:
   - Прочитать `service.schema.json` для описания
   - Проанализировать код метода на вызовы зависимостей и генерацию событий

4. **Анализ подписок:**
   - Для каждого класса в `processing/` каталоге:
   - Определить ключ DI из `inversion.types.ts`
   - Проанализировать метод `start()` для определения сервиса-источника
   - Проанализировать обработчики событий на вызовы и генерацию событий

### Шаг 3: Сборка финального объекта

Собрать все данные в единый объект согласно JSON Schema.

## Пример использования для C4-диаграмм

Сгенерированный `archland.json` используется для автоматического создания:

- **Контейнерной диаграммы:** Взаимосвязи между сервисами
- **Компонентной диаграммы:** Внутренняя структура сервисов и их зависимости

**Преимущества:**
- Автоматическое поддержание актуальности документации
- Возможность анализа impact-изменений
- Визуализация сложных событийных потоков
- Контроль за циклическими зависимостями

---
**Инструкция для LLM:** При генерации кода для nsc-toolkit, параллельно анализируйте создаваемые компоненты и формируйте данные для archland.json. Используйте правила из этого документа для корректного заполнения всех полей. Особое внимание уделите анализу вызовов методов и генерации событий в бизнес-логике.