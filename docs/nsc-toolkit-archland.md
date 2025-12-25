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

**Схема файла archland.json**
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://nsc-toolkit.ru/archland.schema.json",
  "title": "ArchLand Architecture Documentation",
  "$description": "Схема архитектурного описания системы на основе nsc-toolkit",
  "type": "object",
  "required": ["format", "name", "description", "version", "services"],
  "additionalProperties": false,
  "properties": {
    "format": {
      "type": "string",
      "$description": "Версия формата ArchLand",
      "pattern": "^\\d+\\.\\d+$",
      "examples": ["1.0"]
    },
    "name": {
      "type": "string",
      "$description": "Название системы"
    },
    "description": {
      "type": "string",
      "$description": "Описание системы"
    },
    "version": {
      "type": "string",
      "$description": "Версия системы",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "examples": ["1.0.0"]
    },
    "services": {
      "type": "object",
      "$description": "Словарь сервисов системы",
      "additionalProperties": {
        "$ref": "#/$defs/service"
      },
      "minProperties": 1
    }
  },
  "$defs": {
    "service": {
      "type": "object",
      "required": ["describePath", "description", "folderPath", "dependencies", "methods", "subscriptions"],
      "additionalProperties": false,
      "properties": {
        "describePath": {
          "type": "string",
          "$description": "Относительный путь к service.schema.json",
          "pattern": "^.+\\.schema\\.json$"
        },
        "description": {
          "type": "string",
          "$description": "Описание сервиса"
        },
        "folderPath": {
          "type": "string",
          "$description": "Относительный путь к каталогу сервиса",
          "pattern": "^.+/$"
        },
        "dependencies": {
          "type": "object",
          "$description": "Зависимости сервиса",
          "additionalProperties": {
            "$ref": "#/$defs/dependency"
          }
        },
        "methods": {
          "type": "object",
          "$description": "Методы сервиса",
          "additionalProperties": {
            "$ref": "#/$defs/method"
          }
        },
        "subscriptions": {
          "type": "array",
          "$description": "Подписки сервиса на события",
          "items": {
            "$ref": "#/$defs/subscription"
          },
          "default": []
        }
      }
    },
    "dependency": {
      "type": "object",
      "required": ["shared", "className", "classPath", "type", "external", "dependencies"],
      "additionalProperties": false,
      "properties": {
        "shared": {
          "type": "boolean",
          "$description": "Является ли зависимость общей между сервисами"
        },
        "className": {
          "type": "string",
          "$description": "Имя класса зависимости",
          "default": ""
        },
        "classPath": {
          "type": "string",
          "$description": "Путь к файлу класса зависимости",
          "default": ""
        },
        "type": {
          "type": "string",
          "$description": "Тип зависимости",
          "enum": ["dbms", "api", "service", "constant", "adapter", "port"]
        },
        "external": {
          "type": "boolean",
          "$description": "Является ли зависимость внешней"
        },
        "dependencies": {
          "type": "array",
          "$description": "Ключи зависимостей, от которых зависит эта зависимость",
          "items": {
            "type": "string",
            "pattern": "^TYPES\\.[A-Za-z][A-Za-z0-9_]*$"
          },
          "default": []
        }
      }
    },
    "method": {
      "type": "object",
      "required": ["description", "trigger", "calls"],
      "additionalProperties": false,
      "properties": {
        "description": {
          "type": "string",
          "$description": "Описание метода"
        },
        "trigger": {
          "type": "array",
          "$description": "События, генерируемые методом",
          "items": {
            "type": "string"
          },
          "default": []
        },
        "calls": {
          "type": "array",
          "$description": "Вызовы других методов",
          "items": {
            "$ref": "#/$defs/methodCall"
          },
          "default": []
        }
      }
    },
    "methodCall": {
      "type": "object",
      "required": ["dependencyKey", "method"],
      "additionalProperties": false,
      "properties": {
        "dependencyKey": {
          "type": "string",
          "$description": "Ключ зависимости в DI-контейнере",
          "pattern": "^TYPES\\.[A-Za-z][A-Za-z0-9_]*$"
        },
        "method": {
          "type": "string",
          "$description": "Имя вызываемого метода"
        }
      }
    },
    "subscription": {
      "type": "object",
      "required": ["from", "event", "dependencyKey", "calls", "trigger"],
      "additionalProperties": false,
      "properties": {
        "from": {
          "type": "string",
          "$description": "Сервис-источник события"
        },
        "event": {
          "type": "string",
          "$description": "Название события"
        },
        "dependencyKey": {
          "type": "string",
          "$description": "Ключ DI для обработчика события",
          "pattern": "^TYPES\\.[A-Za-z][A-Za-z0-9_]*$"
        },
        "calls": {
          "type": "array",
          "$description": "Вызовы в обработчике события",
          "items": {
            "$ref": "#/$defs/methodCall"
          },
          "default": []
        },
        "trigger": {
          "type": "array",
          "$description": "События, генерируемые обработчиком",
          "items": {
            "type": "string"
          },
          "default": []
        }
      }
    }
  }
}
```

**ПРИМЕР**
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
          "dependencies": ["TYPES.Config"],
        },
        "TYPES.AuthService": {
          "shared": true,
          "className": "AuthClient",
          "classPath": "../AuthService/index.ts",
          "type": "service",
          "external": false
        },
        "TYPES.Config": {
          "shared": false,
          "className": "",
          "classPath": "",
          "type": "constant",
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
  "dependencies": []
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

- `dependencies`: рекурсивный анализ зависимостей класса через конструктор. Список ключей зависимостей, которые треьбуются зависимости

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

**ПРИМЕР контейнерной диаграммы**
```
@startuml C4 Container Diagram
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

title MathCalculationSystem: Контейнерная диаграмма

skinparam linetype ortho

System_Boundary(system, "Система математических расчетов") {
    Container(math_svc, "MathService", "nsc-toolkit", "Сервис математических операций")
    
    Container(auth_svc, "AuthService", "nsc-toolkit", "Сервис аутентификации")
    
    ContainerDb(pg_db, "PostgreSQL", "RDBMS", "Хранилище расчетов")
    
    ContainerDb(mongo_db, "MongoDB", "NoSQL", "Хранилище пользователей")
}

' Синхронные вызовы (сплошные линии)
math_svc --> auth_svc
math_svc --> pg_db
math_svc -right-> pg_db
auth_svc --> mongo_db

' Асинхронные подписки (пунктирные линии)
auth_svc ..> math_svc

@enduml
```

# Инструкция для генерации контейнерной диаграммы C4 из archland.json

## Входные данные
Файл `archland.json` с описанием архитектуры системы.

## Правила генерации диаграммы

### 1. Определение контейнеров
Для каждого сервиса в `archland.json.services` создай контейнер `Container`:
- Имя: ключ сервиса (например, `MathService`)
- Технология: всегда `"nsc-toolkit"`
- Описание: `services[serviceName].description`

Для каждой зависимости типа `"dbms"` создай контейнер `ContainerDb`:
- Имя: тип базы данных (определяется по `className`)
- Технология: `"RDBMS"` или `"NoSQL"`
- Описание: `"Хранилище [назначение]"`

### 2. Определение связей
#### Синхронные вызовы (сплошные стрелки `-->`)
Для каждого метода в `services[serviceName].methods`:
- Если в `calls` есть вызов к другому сервису (`dependencyKey` другого сервиса):
  - Добавь стрелку `[текущий_сервис] --> [целевой_сервис]`
- Если в `calls` есть вызов к зависимости типа `"dbms"`:
  - Добавь стрелку `[текущий_сервис] --> [база_данных]`

**Важно:** Каждый уникальный вызов - отдельная стрелка.

#### Асинхронные подписки (пунктирные стрелки `..>`)
Для каждой подписки в `services[serviceName].subscriptions`:
- Добавь пунктирную стрелку `[from_сервис] ..> [текущий_сервис]`

**Важно:** Каждая уникальная подписка - отдельная пунктирная стрелка.

### 3. Форматирование диаграммы
Используй следующий шаблон:
```plantuml
@startuml C4 Container Diagram
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

title [Имя_системы]: Контейнерная диаграмма

skinparam linetype ortho

System_Boundary(system, "[Имя_системы]") {
    [КОНТЕЙНЕРЫ_СЕРВИСОВ]
    [КОНТЕЙНЕРЫ_БАЗ_ДАННЫХ]
}

' Синхронные вызовы (сплошные линии)
[СПЛОШНЫЕ_СТРЕЛКИ]

' Асинхронные подписки (пунктирные линии)
[ПУНКТИРНЫЕ_СТРЕЛКИ]

@enduml
```

## Алгоритм генерации

1. **Собрать все сервисы:**
   ```javascript
   services = archland.json.services
   ```

2. **Собрать все базы данных:**
   ```javascript
   databases = {}
   для каждого сервиса в services:
     для каждой зависимости в service.dependencies:
       если dependency.type === "dbms":
         databases[dependency.className] = dependency
   ```

3. **Сгенерировать контейнеры сервисов:**
   ```plantuml
   Container(math_svc, "MathService", "nsc-toolkit", "Сервис математических операций")
   Container(auth_svc, "AuthService", "nsc-toolkit", "Сервис аутентификации")
   ```

4. **Сгенерировать контейнеры баз данных:**
   ```plantuml
   ContainerDb(pg_db, "PostgreSQL", "RDBMS", "Хранилище расчетов")
   ContainerDb(mongo_db, "MongoDB", "NoSQL", "Хранилище пользователей")
   ```

5. **Сгенерировать синхронные связи:**
   - Проанализировать все `methods.{methodName}.calls`
   - Для каждого уникального вызова между сервисами → добавить `-->`
   - Для каждого вызова к базе данных → добавить `-->`

6. **Сгенерировать асинхронные связи:**
   - Проанализировать все `subscriptions`
   - Для каждой подписки → добавить `..>`

## Пример из данных

**Исходные данные:**
```json
{
  "name": "MathCalculationSystem",
  "services": {
    "MathService": {
      "methods": {
        "Sum": {"calls": [{"dependencyKey": "TYPES.Repository", "method": "saveCalculation"}]},
        "ComplexCalculation": {"calls": [
          {"dependencyKey": "TYPES.AuthService", "method": "validateToken"},
          {"dependencyKey": "TYPES.Repository", "method": "getHistoricalData"}
        ]}
      },
      "subscriptions": [
        {"from": "AuthService", "event": "UserLoggedIn"}
      ]
    },
    "AuthService": {
      "methods": {
        "ValidateToken": {"calls": [{"dependencyKey": "TYPES.UserRepository", "method": "findUserByToken"}]}
      }
    }
  }
}
```

**Результат:**
- 3 синхронные стрелки (MathService→AuthService, MathService→PostgreSQL ×2)
- 1 асинхронная стрелка (AuthService→MathService)
- 1 синхронная стрелка (AuthService→MongoDB)

## Важные правила

1. **Без пользователя:** Не добавляй `Person` элементы
2. **Без текста на стрелках:** Не добавляй подписи к стрелкам
3. **Прямые углы:** Всегда используй `skinparam linetype ortho`
4. **Чистая схема:** Без дополнительных примечаний и легенд
5. **Каждый вызов = отдельная стрелка:** Даже если одинаковые сервисы

- **Компонентной диаграммы:** Внутренняя структура сервисов и их зависимости

# Инструкция для генерации компонентных диаграмм C4 из archland.json

## Назначение
Генерация отдельных компонентных диаграмм C4 для каждого сервиса из файла `archland.json`.

## Входные данные
Файл `archland.json` с описанием архитектуры системы.

## Алгоритм генерации для каждого сервиса

### 1. Определение базовой структуры диаграммы
Для каждого сервиса `serviceName` в `archland.json.services`:

```plantuml
@startuml C4 Component Diagram - [serviceName]
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

title [serviceName]: Компонентная диаграмма

skinparam linetype ortho

Container_Boundary([serviceName_lower], "[serviceName]") {
    [КОМПОНЕНТЫ_СЕРВИСА]
}

[ВНЕШНИЕ_ЭЛЕМЕНТЫ]

[ВНУТРЕННИЕ_СВЯЗИ]
[ВНЕШНИЕ_СВЯЗИ]
[СОБЫТИЯ]

@enduml
```

### 2. Определение компонентов сервиса

#### 2.1. Методы (Methods)
Для каждого метода в `services[serviceName].methods`:
```plantuml
Component([method_name_lower], "[method_name]", "Method", "")
```

#### 2.2. Обработчики событий (Subscriptions)
Для каждой подписки в `services[serviceName].subscriptions`:
```plantuml
Component([handler_name_lower], "[dependencyKey без TYPES.]", "EventHandler", "")
```

#### 2.3. Зависимости (Dependencies)
Для каждой зависимости в `services[serviceName].dependencies`, где `type` не равен `"service"`:
```plantuml
Component([dep_name_lower], "[className или dependencyKey без TYPES.]", "[type]", "")
```

**Исключение:** Зависимости типа `"service"` не показываются как внутренние компоненты.

### 3. Определение внешних элементов

#### 3.1. Внешние сервисы
Для каждой зависимости типа `"service"` в `services[serviceName].dependencies`:
```plantuml
Container_Ext([ext_service_lower], "[className]", "", "")
```

#### 3.2. Внешние базы данных
Для каждой зависимости типа `"dbms"` в `services[serviceName].dependencies`:
```plantuml
ContainerDb_Ext([ext_db_lower], "[className]", "", "")
```

### 4. Определение связей

#### 4.1. Внутренние синхронные вызовы
Для каждого вызова в `methods.{methodName}.calls`, где `dependencyKey` указывает на внутреннюю зависимость:
```plantuml
[method_name_lower] --> [dep_name_lower] : "[method]"
```

#### 4.2. Внешние синхронные вызовы
Для каждого вызова в `methods.{methodName}.calls`, где `dependencyKey` указывает на внешний сервис:
```plantuml
[method_name_lower] --> [ext_service_lower] : "[method]"
```

#### 4.3. Зависимости между зависимостями
Если у зависимости есть свои `dependencies` (массив), создаем связь:
```plantuml
[dep_name_lower] --> [inner_dep_name_lower] : "[тип связи]"
```

### 5. Определение событий

#### 5.1. Входящие асинхронные события
Для каждой подписки в `services[serviceName].subscriptions`:
```plantuml
[from_service_lower] ..> [handler_name_lower] : "[event]"
```

#### 5.2. Исходящие асинхронные события
Для каждого события в `methods.{methodName}.trigger` и `subscriptions[].trigger`:

**Если есть подписчики в системе** (определяется по полной архитектуре):
```plantuml
[source_component_lower] ..> [subscriber_service_lower] : "[event_name]"
```

**Если нет подписчиков** (красные стрелки):
```plantuml
[source_component_lower] -[#red]..> [event_name_lower]_dummy : "[event_name]"
```

## Пример для MathService

**Исходные данные из archland.json:**
```json
{
  "MathService": {
    "methods": {
      "Sum": {
        "calls": [{"dependencyKey": "TYPES.Repository", "method": "saveCalculation"}],
        "trigger": ["CalculationElapsed"]
      },
      "ComplexCalculation": {
        "calls": [
          {"dependencyKey": "TYPES.AuthService", "method": "validateToken"},
          {"dependencyKey": "TYPES.Repository", "method": "getHistoricalData"}
        ],
        "trigger": ["CalculationStarted", "CalculationFinished"]
      }
    },
    "subscriptions": [{
      "from": "AuthService",
      "event": "UserLoggedIn",
      "dependencyKey": "TYPES.AuthProcessing",
      "calls": [{"dependencyKey": "TYPES.Repository", "method": "updateUserSession"}],
      "trigger": ["UserSessionUpdated"]
    }],
    "dependencies": {
      "TYPES.Repository": {"type": "dbms", "className": "PostgresRepository"},
      "TYPES.AuthService": {"type": "service", "className": "AuthClient"},
      "TYPES.Config": {"type": "constant", "className": ""}
    }
  }
}
```

**Сгенерированная диаграмма:**
```plantuml
@startuml C4 Component Diagram - MathService
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

title MathService: Компонентная диаграмма

skinparam linetype ortho

Container_Boundary(math_service, "MathService") {
    Component(sum_method, "Sum", "Method", "")
    Component(complex_method, "ComplexCalculation", "Method", "")
    Component(auth_processing, "AuthProcessing", "EventHandler", "")
    Component(postgres_repo, "PostgresRepository", "Repository", "")
    Component(config, "Config", "Configuration", "")
}

' Внешние элементы
Container_Ext(auth_svc_ext, "AuthService", "", "")
ContainerDb_Ext(postgres_ext, "PostgreSQL", "", "")

' Внутренние синхронные вызовы
sum_method --> postgres_repo : "saveCalculation"
complex_method --> postgres_repo : "getHistoricalData"
auth_processing --> postgres_repo : "updateUserSession"
postgres_repo --> config : "config"

' Внешние синхронные вызовы
complex_method --> auth_svc_ext : "validateToken"
postgres_repo --> postgres_ext : "SQL"

' Входящие асинхронные события
auth_svc_ext ..> auth_processing : "UserLoggedIn"

' Исходящие асинхронные события без подписчиков (красные)
sum_method -[#red]..> calculation_elapsed_dummy : "CalculationElapsed"
complex_method -[#red]..> calculation_started_dummy : "CalculationStarted"
complex_method -[#red]..> calculation_finished_dummy : "CalculationFinished"
auth_processing -[#red]..> user_session_updated_dummy : "UserSessionUpdated"

@enduml
```

## Правила именования

1. **Идентификаторы компонентов:** `[name]_lower` (нижний регистр, без пробелов)
2. **Методы в подписях:** Без скобок `()`
3. **События:** Только название события
4. **Типы компонентов:**
   - `"Method"` - для методов
   - `"EventHandler"` - для обработчиков событий
   - `"Repository"` - для `type: "dbms"`
   - `"Configuration"` - для `type: "constant"`
   - `[type]` - для других типов зависимостей

## Обработка особых случаев

1. **Пустые массивы:** Если `subscriptions: []` - не создавать обработчиков событий
2. **Пустые зависимости:** Если у зависимости нет `dependencies` - не создавать внутренних связей
3. **Отсутствие вызовов:** Если `calls: []` - не создавать стрелок от метода
4. **Отсутствие событий:** Если `trigger: []` - не создавать исходящих событий

## Выходные данные
По одному файлу `.puml` для каждого сервиса в формате `[serviceName]_component_diagram.puml`.

**Преимущества:**
- Автоматическое поддержание актуальности документации
- Возможность анализа impact-изменений
- Визуализация сложных событийных потоков
- Контроль за циклическими зависимостями

---
**Инструкция для LLM:** При генерации кода для nsc-toolkit, параллельно анализируйте создаваемые компоненты и формируйте данные для archland.json. Используйте правила из этого документа для корректного заполнения всех полей. Особое внимание уделите анализу вызовов методов и генерации событий в бизнес-логике.