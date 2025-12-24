# Фреймворк nsc-toolkit: Руководство для генерации кода

Это руководство описывает архитектурный фреймворк `nsc-toolkit` для создания событийно-управляемых распределенных систем на TypeScript. Документ структурирован как набор правил и шаблонов для автоматической генерации корректного кода.

## Оглавление
- [Фреймворк nsc-toolkit: Руководство для генерации кода](#фреймворк-nsc-toolkit-руководство-для-генерации-кода)
  - [Оглавление](#оглавление)
  - [Концепция и Технологии](#концепция-и-технологии)
  - [Базовая настройка проекта и зависимостей](#базовая-настройка-проекта-и-зависимостей)
  - [Создание Сервиса: Schema-First подход](#создание-сервиса-schema-first-подход)
    - [Правила для `service.schema.json`:](#правила-для-serviceschemajson)
  - [Структура Файлов Сервиса](#структура-файлов-сервиса)
  - [Ядро Фреймворка: Классы и Типы](#ядро-фреймворка-классы-и-типы)
    - [1. Класс Метода (`BaseMethod`)](#1-класс-метода-basemethod)
    - [2. Типы и Интерфейсы (`interfaces.ts`)](#2-типы-и-интерфейсы-interfacests)
    - [3. Клиент Сервиса (`index.ts`)](#3-клиент-сервиса-indexts)
  - [Dependency Injection (DI) Контейнер](#dependency-injection-di-контейнер)
    - [1. Ключи Зависимостей (`inversion.types.ts`)](#1-ключи-зависимостей-inversiontypests)
    - [2. Конфигурация Контейнера (`service.ts`)](#2-конфигурация-контейнера-servicets)
  - [Межсервисное Взаимодействие: Клиенты и События](#межсервисное-взаимодействие-клиенты-и-события)
    - [Типы Listener'ов](#типы-listenerов)
    - [Получение Listener'ов](#получение-listenerов)
  - [Подписка на события через отдельные классы-обработчики](#подписка-на-события-через-отдельные-классы-обработчики)
    - [Структура класса-обработчика](#структура-класса-обработчика)
    - [Интеграция обработчиков в service.ts](#интеграция-обработчиков-в-servicets)
    - [Типы событий для обработчиков](#типы-событий-для-обработчиков)
  - [Сборка и Запуск Сервиса](#сборка-и-запуск-сервиса)
  - [Конфигурация сервисов через переменные окружения](#конфигурация-сервисов-через-переменные-окружения)
    - [Ключевые правила конфигурации:](#ключевые-правила-конфигурации)
    - [Шаблон файла config.ts](#шаблон-файла-configts)
    - [Интеграция конфигурации с DI-контейнером](#интеграция-конфигурации-с-di-контейнером)
    - [Использование конфигурации в адаптерах](#использование-конфигурации-в-адаптерах)
    - [Правила именования переменных окружения](#правила-именования-переменных-окружения)
    - [Валидация конфигурации](#валидация-конфигурации)
  - [Структура Проекта](#структура-проекта)

## Концепция и Технологии

**Цель:** Создание событийно-управляемых (EDA) распределенных систем.

**Технологический стек:**
- **TypeScript**: Основной язык.
- **NATS** (с JetStream): Брокер сообщений для коммуникации.
- **JSON Schema**: Валидация входящих/исходящих сообщений.
- **OpenTelemetry (OTLP)**: Трассировка.

**Архитектурные шаблоны:**
- Event-Driven Architecture (EDA)
- Dependency Injection (DI) & Inversion
- Hexagonal Architecture
- Repository Pattern

## Базовая настройка проекта и зависимостей
Установка nsc-tookit производится с помощью команды

```
npm i @lad-tech/nsc-toolkit
```

Актуальная версия фреймворка 2.x

Установка драйвера nats производится с помощью команды

```
npm install nats
```

Актуальная версия клиента 2.x

Создай конфигурацию для Node.js проекта на TypeScript с современными настройками.

Требования к конфигурации проекта:
- Проект должен использовать ESM (ECMAScript Modules) вместо CommonJS
- TypeScript конфигурация должна быть актуальной на текущий момент
- Включины все современные возможности TypeScript
- Настройки должны соответствовать лучшим практикам для 2025 года

Что нужно настроить:
1. package.json с type: "module" и современными скриптами
2. tsconfig.json с актуальными настройками для ESM
3. .gitignore для Node.js/TypeScript проекта

Конфигурация TypeScript:
- Поддерживает современный синтаксис ESNEXT
- Включает строгие проверки TypeScript
- Настроена для работы с ESM в Node.js
- Содержит правильные настройки модулей и разрешения путей

## Создание Сервиса: Schema-First подход

Процесс начинается с создания файла `service.schema.json`. Этот файл является единственным источником истины для сервиса.

### Правила для `service.schema.json`:

1.  **Расположение:** Файл должен находиться в корне каталога сервиса.
2.  **Структура:** Строго следуйте предоставленной JSON Schema. Все поля, помеченные `"required"`, должны быть заполнены.
3.  **Именование:** Используйте соглашение `PascalCase` для имен сервисов, методов и событий внутри схемы (например, `"Math"`, `"Sum"`, `"Elapsed"`). Поле `action` должно быть в `camelCase` (например, `"sum"`, `"userCreated"`).

**Схема `service.schema.json`**
```
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "methods": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "action": { "type": "string" },
          "description": { "type": "string" },
          "options": { "$ref": "#/$defs/options" },
          "request": { "type": "object" },
          "response": { "type": "object" }
        },
        "required": ["action", "description", "options"]
      }
    },
    "events": {
      "type": "object",
      "properties": {
        "list": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "action": { "type": "string" },
              "options": {
                "type": "object",
                "properties": {
                  "stream": { "type": "boolean" }
                },
              },
              "description": { "type": "string" },
              "event": { "type": "object" }
            },
            "required": ["action", "description", "event"]
          },
        },
        "streamOptions": {
          "type": "object",
          "properties": {
            "prefix": { "type": "string" },
            "actions": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "action": { "type": "string" },
                  "storage": { "type": "string" },
                  "retentionPolicy": { "type": "string" },
                  "discardPolicy": { "type": "string" },
                  "messageTTL": { "type": "number" },
                  "duplicateTrackingTime": { "type": "number" },
                  "replication": { "type": "number" },
                  "rollUps": { "type": "boolean" }
                },
                "required": ["action"]
              }
            }
          },
          "required": ["prefix", "actions"]
        }
      },
      "required": ["list"]
    }
  },
  "required": ["name", "description", "methods"],

  "$defs": {
    "options": {
      "type": "object",
      "properties": {
        "useStream": {
          "type": "object",
          "properties": {
            "request": { "type": "boolean" },
            "response": { "type": "boolean" }
          }
        },
        "cache": { "type": "number" },
        "runTimeValidation": {
          "type": "object",
          "properties": {
            "request": { "type": "boolean" },
            "response": { "type": "boolean" }
          }
        }
      }
    }
  }
}
```

**ПРИМЕР**
```json
{
  "name": "Math",
  "description": "Сервис для математических операций",
  "methods": {
    "Sum": {
      "action": "sum",
      "description": "Сложение двух чисел",
      "options": {
        "runTimeValidation": {
          "request": true,
          "response": true
        },
        "cache": 30
      },
      "request": {
        "type": "object",
        "properties": {
          "a": { "type": "number" },
          "b": { "type": "number" }
        },
        "required": ["a", "b"]
      },
      "response": {
        "type": "object",
        "properties": {
          "result": { "type": "number" }
        },
        "required": ["result"]
      }
    }
  },
  "events": {
    "list": {
      "CalculationElapsed": {
        "action": "calculation.elapsed",
        "description": "Событие о времени выполнения расчета",
        "options": {
          "stream": true
        },
        "event": {
          "type": "object",
          "properties": {
            "elapsed": { "type": "number" }
          },
          "required": ["elapsed"]
        }
      }
    },
    "streamOptions": {
      "prefix": "math.events",
      "actions": [
        {
          "action": ">",
          "storage": "file",
          "retentionPolicy": "limits",
          "discardPolicy": "old",
          "messageTTL": 1209600,
          "duplicateTrackingTime": 86400,
          "replication": 1,
          "rollUps": true
        }
      ]
    }
  }
}
```

## Структура Файлов Сервиса

Каждый сервис ДОЛЖЕН содержать следующие файлы в своем корне:

1.  `service.schema.json`: Описание сервиса.
2.  `interfaces.ts`: Автоматически генерируемые TypeScript-типы на основе схемы.
3.  `inversion.types.ts`: Ключи (символы) для DI контейнера.
4.  `index.ts`: Клиент сервиса для вызова его методов.
5.  `service.ts`: Конфигурация DI и сборка сервиса.
6.  `start.ts`: Точка входа.
7.  `config.ts`: Класс конфигурации

## Ядро Фреймворка: Классы и Типы

### 1. Класс Метода (`BaseMethod`)

Каждый метод сервиса должен быть реализован как класс, расширяющий `BaseMethod<EmitterType>`.

**Правила реализации:**
- Обязательно объявите статическое свойство `settings`, скопированное из `service.schema.json`.
- Основная логика реализуется в методе `handler`.
- Внедряйте зависимости через конструктор с декоратором `@inject`.
- Используйте `this.logger` для логирования.
- Используйте `this.emitter` для генерации событий.

**ПРИМЕР**
```typescript
// Файл: methods/Sum/index.ts
import { SumRequest, SumResponse, EmitterMath } from '../../interfaces.js';
import serviceSchema from '../../service.schema.json' with { type: 'json' };
import { BaseMethod, inject } from '@lad-tech/nsc-toolkit';
import { TYPES } from '../../inversion.types.js';
import type { RepositoryPort } from '../../domain/ports/index.js';

export class Sum extends BaseMethod<EmitterMath> {
  // ПРАВИЛО: Всегда объявляйте статическое свойство settings.
  static settings = serviceSchema.methods.Sum;

  constructor(
    // ПРАВИЛО: Внедряйте зависимости через декоратор @inject
    @inject(TYPES.Repository) private repository: RepositoryPort
  ) {
    super();
  }

  // ПРАВИЛО: Основная логика в методе handler.
  public async handler(request: SumRequest): Promise<SumResponse> {
    this.logger.info('Starting sum calculation');
    const startTime = Date.now();

    const result = request.a + request.b;

    // ПРАВИЛО: Генерируйте события через this.emitter.
    this.emitter.CalculationElapsed({ elapsed: Date.now() - startTime });

    this.logger.debug('Calculation finished', { result });
    return { result };
  }
}
```

### 2. Типы и Интерфейсы (`interfaces.ts`)

Файл `interfaces.ts` автоматически генерируется на основе `service.schema.json`. Он содержит:
- Типы запросов и ответов для методов (например, `SumRequest`, `SumResponse`).
- Типы событий (например, `CalculationElapsedEvent`).
- Типы эмиттеров: `Emitter{ServiceName}` для использования внутри сервиса и `Emitter{ServiceName}External` для использования клиентом.


**ПРИМЕР**
```typescript
// Файл: interfaces.ts (Автогенерация на основе service.schema.json)
import type { EventStreamHandler, Emitter } from '@lad-tech/nsc-toolkit';

// Типы для метода Sum. ПРАВИЛО: Тип запроса (Request) ВСЕГДА ДОЛЖЕН содержать index signature (сигнатура индекса) [k: string]: unknown | undefined;
export interface SumRequest { a: number; b: number; [k: string]: unknown | undefined; }
export interface SumResponse { result: number; }

// Типы для события CalculationElapsed
export interface CalculationElapsedEvent { elapsed: number; }

// Emitter для внутреннего использования в методах сервиса
export type EmitterMath = {
  CalculationElapsed: (params: CalculationElapsedEvent, uniqId?: string) => void;
};

// Emitter для внешнего использования клиентами сервиса
export type EmitterMathExternal = {
  CalculationElapsed: EventStreamHandler<CalculationElapsedEvent>;
};
```

### 3. Клиент Сервиса (`index.ts`)

Файл `index.ts` предоставляет класс-клиент для вызова методов сервиса извне. Он расширяет базовый класс `Client`.

**ПРИМЕР**
```typescript
// Файл: index.ts (Часто автогенерируется)
import { Client, Baggage, CacheSettings } from '@lad-tech/nsc-toolkit';
import type { NatsConnection } from 'nats';
import { Logs } from '@lad-tech/toolbelt';
import type { EmitterMathExternal, SumRequest, SumResponse } from './interfaces.js';
import serviceSchema from './service.schema.json' with { type: 'json' };

const { name, methods } = serviceSchema;

export default class MathClient extends Client<EmitterMathExternal> {
  constructor(
    broker: NatsConnection,
    baggage?: Baggage,
    cache?: CacheSettings,
    loggerOutputFormatter?: Logs.OutputFormatter
  ) {
    super({ broker, serviceName: name, baggage, cache });
  }

  // ПРАВИЛО: Создайте метод для каждого RPC-вызова из service.schema.json
  public async sum(payload: SumRequest): Promise<SumResponse> {
    return this.request<SumResponse>(
      `${name}.${methods.Sum.action}`, // subject вызова
      payload,                         // данные запроса
      methods.Sum                      // schema метода для валидации
    );
  }
}
```

## Dependency Injection (DI) Контейнер

Все необходимые зависимости для работы сервиса должны быть внедрены в логику через DI-контейнер. К контейнеру должны быть привязаны только необходимые и используемые зависимости. Если зависимость не используется. Например клиент другого сервиса, который нигде не используется сервисом то он не должен быть привязан к контейнеру. В контейнеру должны быть привязаны только актуальные и используемые зависимости.

### 1. Ключи Зависимостей (`inversion.types.ts`)

Определите все ключи для зависимостей в одном файле.

**ПРИМЕР**
```typescript
// Файл: inversion.types.ts
export const TYPES = {
  // Порты (интерфейсы) из domain/ports
  Repository: Symbol.for('Repository'),
  Configurator: Symbol.for('Configurator'),
  // Клиенты других сервисов
  MathService: Symbol.for('MathService'),
  // Адаптеры (обработчики событий)
  MathProcessing: Symbol.for('MathProcessing'),
};
```

### 2. Конфигурация Контейнера (`service.ts`)

В файле `service.ts` привяжите реализации к интерфейсам и настройте сервис.

**Правила привязки:**
- `DependencyType.SERVICE`: Для клиентов других сервисов.
- `DependencyType.ADAPTER`: Для реализаций портов (репозитории, внешние API). Может иметь опции `singleton: true` или `init: true`.
- `DependencyType.CONSTANT`: Для статических объектов (конфиги).

**ПРИМЕР**
```typescript
// Файл: service.ts
import { Service, DependencyType, container } from '@lad-tech/nsc-toolkit';
import { connect, NatsConnection } from 'nats';

// Импорт схемы, ключей, портов, адаптеров, методов и клиентов
import serviceSchema from './service.schema.json' with { type: 'json' };
import { TYPES } from './inversion.types.js';
import type { RepositoryPort } from './domain/ports/index.js';
import { Repository, Configurator } from './adapters/index.js';
import { Sum } from './methods/Sum/index.js';
import { MathProcessing } from './processing/MathProcessing/index.js';
import MathClient from './index.js'; // Клиент этого сервиса
import AnotherServiceClient from 'AnotherService'; // Клиент другого сервиса

export const service = async (broker?: NatsConnection) => {
  const { name, events } = serviceSchema;
  const brokerConnection = broker || (await connect({ servers: ['localhost:4222'] }));

  // ПРАВИЛО: Привяжите все зависимости к контейнеру.
  // Сервис (клиент другого сервиса)
  container.bind(TYPES.AnotherService, DependencyType.SERVICE, AnotherServiceClient);
  // Адаптер (репозиторий) в режиме синглтона
  container.bind<RepositoryPort>(TYPES.Repository, DependencyType.ADAPTER, Repository, {
    singleton: true,
    tag: { location: 'internal', type: 'dbms', name: 'postgres', target: 'users' }
  });
  // Адаптер, требующий инициализации (имеет метод init())
  container.bind(TYPES.Configurator, DependencyType.ADAPTER, Configurator, { init: true });
  // Константа (объект конфигурации)
  container.bind(TYPES.Config, DependencyType.CONSTANT, { someConfig: 'value' });
  // Адаптер (обработчик событий)
  container.bind(TYPES.MathProcessing, DependencyType.ADAPTER, MathProcessing);

  // Создание экземпляра сервиса
  const serviceInstance = new Service({
    name, // из service.schema.json
    brokerConnection,
    methods: [Sum], // Массив всех классов методов
    events,         // из service.schema.json
    gracefulShutdown: {
      additional: [Repository], // Сервисы с методом close()
      timeout: 10 // секунды
    }
  });

  // ПРАВИЛО: Инициализируйте зависимости с методом init()
  await container.initDependencies();

  await serviceInstance.start();
  return serviceInstance;
};
```

## Межсервисное Взаимодействие: Клиенты и События

### Типы Listener'ов

Фреймворк предоставляет два типа listener'ов для подписки на события:

1.  **Listener** - обрабатывает сообщения по одному
```typescript
interface Listener<E extends Emitter> {
  on<A extends keyof E>(action: A, handler: E[A]): void;
  off<A extends keyof E>(action: A, handler: E[A]): void;
}
```

2.  **ListenerBatch** - обрабатывает сообщения батчами
```typescript
interface ListenerBatch<E extends Emitter> {
  on<A extends keyof E>(action: A, handler: (params: Array<Parameters<E[A]>[0]>, meter: EventMeter) => void): void;
  off<A extends keyof E>(action: A, handler: (params: Array<Parameters<E[A]>[0]>) => void): void;
}
```

### Получение Listener'ов

```typescript
// Для обработки по одному сообщению
const listener = client.getListener('MyService', {
  deliver: 'all' // 'all' | 'new'
});

// Для батчевой обработки
const batchListener = client.getListener('MyService:Batch', {
  deliver: 'new',
  batch: true,
  maxPullRequestBatch: 19,
  maxPullRequestExpires: 5_000,
  maxPending: 1_000
});
```

## Подписка на события через отдельные классы-обработчики

**ВАЖНОЕ ПРАВИЛО:** Для подписки на события других сервисов следует создавать отдельные классы-обработчики в каталоге `processing/`. Эти классы должны быть привязаны к DI-контейнеру и запускаться в файле `service.ts`.

### Структура класса-обработчика

```typescript
// Файл: processing/AnotherServiceProcessing/index.ts
import { inject, EventMeter, Listener } from '@lad-tech/nsc-toolkit';
import { TYPES } from '../../inversion.types.js';
import type { RepositoryPort } from '../../domain/ports/index.js';
import AnotherServiceClient from 'AnotherService';
import type { EmitterAnotherServiceExternal } from 'AnotherService/interfaces.js';

export class AnotherServiceProcessing {
  private listener: Listener<EmitterAnotherServiceExternal>;

  constructor(
    @inject(TYPES.Repository) private repository: RepositoryPort,
  ) {}

  // Обработчик для одиночных событий из стрима
  private async onUserCreated(event: { 
    data: { userId: string }; 
    ack: () => void; 
    nak: (ms: number) => void; 
    meter: EventMeter 
  }) {
    try {
      event.meter.start();
      // Логика обработки...
      await this.repository.save({ id: event.data.userId });
      event.ack(); // Подтверждение обработки - ВАЖНО!
    } catch (error) {
      // В случае ошибки сообщение будет обработано повторно через указанное время
      event.nak(5000); // Запланировать повтор через 5 секунд
    } finally {
      event.meter.end();
    }
  }

  // Обработчик для батчевых событий
  private async onUsersBatch(messages: Array<{
    data: { userId: string };
    ack: () => void;
    nak: (ms: number) => void;
    meter: EventMeter;
  }>, meter: EventMeter) {
    try {
      meter.start();
      // Логика обработки батча...
      for (const message of messages) {
        await this.repository.save({ id: message.data.userId });
        message.ack(); // Подтверждаем каждое сообщение
      }
    } catch (error) {
      // В случае ошибки весь батч будет обработан повторно
      messages.forEach(message => message.nak(1000));
    } finally {
      meter.end();
    }
  }

  public start(anotherService: AnotherServiceClient) {
    // Получение Listener для обработки по одному сообщению
    this.listener = anotherService.getListener('MyService', { 
      deliver: 'new' // Только новые сообщения
    });
    this.listener.on('UserCreated', this.onUserCreated.bind(this));

    // Получение Listener для батчевой обработки
    const batchListener = anotherService.getListener('MyService:Batch', {
      deliver: 'new',
      batch: true,
      maxPullRequestBatch: 10,
      maxPullRequestExpires: 3000
    });
    batchListener.on('UserCreated', this.onUsersBatch.bind(this));
  }

  public stop() {
    // Важно отписываться от событий при остановке
    this.listener?.off('UserCreated', this.onUserCreated.bind(this));
  }
}
```

### Интеграция обработчиков в service.ts

```typescript
// Файл: service.ts (дополнение)
export const service = async (broker?: NatsConnection) => {
  const brokerConnection = broker || (await connect({ servers: ['localhost:4222'] }));

  // ... привязка других зависимостей ...

  // ПРАВИЛО: Привяжите класс-обработчик как ADAPTER
  container.bind(TYPES.AnotherServiceProcessing, DependencyType.ADAPTER, AnotherServiceProcessing);

  const serviceInstance = new Service({
    name,
    brokerConnection,
    methods: [Sum],
    events,
    gracefulShutdown: {
      additional: [Repository, AnotherServiceProcessing], // Добавьте обработчик в graceful shutdown
      timeout: 10
    }
  });

  await container.initDependencies();

  // ПРАВИЛО: Получите экземпляр обработчика и запустите его
  const anotherServiceProcessing = container.getInstance<AnotherServiceProcessing>(TYPES.AnotherServiceProcessing);
  const anotherServiceClient = serviceInstance.buildService(AnotherServiceClient);
  
  // Запуск обработчика событий
  anotherServiceProcessing.start(anotherServiceClient);

  await serviceInstance.start();
  return serviceInstance;
};
```

### Типы событий для обработчиков

При работе с событиями используются следующие типы:

- **EmitterEvent** - для событий не из стрима:
```typescript
interface EmitterEvent<D extends Record<string, any>> {
  data: D;
  meter: EventMeter;
}
```

- **EmitterStreamEvent** - для событий из стрима (требуют подтверждения):
```typescript
interface EmitterStreamEvent<D extends Record<string, any>> extends EmitterEvent<D> {
  ack: () => void;           // Подтверждение обработки
  nak: (millis: number) => void; // Отклонение (повтор через millis мс)
  meter: EventMeter;
}
```

## Сборка и Запуск Сервиса

Точка входа `start.ts` должна быть минималистичной.

```typescript
// Файл: start.ts
import { service } from './service.js';

// Запуск сервиса
service().catch((error) => {
  console.error('Failed to start service:', error);
  process.exit(1);
});
```

## Конфигурация сервисов через переменные окружения

Сервисы настраиваются через **переменные окружения**. Это включает настройки подключений (NATS, СУБД), флаги функциональности и другие параметры.

### Ключевые правила конфигурации:

1.  **Библиотека:** Для работы с конфигурацией используется библиотека `@lad-tech/config` (актуальная версия 1.x).
2.  **Файл конфигурации:** Каждый сервис должен содержать файл `config.ts` в своем корне.
3.  **Синглтон:** Экземпляр класса конфигурации является синглтоном и должен быть привязан к DI-контейнеру как `DependencyType.CONSTANT`.

### Шаблон файла config.ts

```typescript
// Файл: config.ts
import { Config } from '@lad-tech/config';

class ServiceConfig extends Config {
  // Общее описание конфигурации сервиса
  description = 'MathService';

  // Пример: строка подключения к NATS
  natsUrl = this.param('natsUrl')
    .fromEnv('NATS_URL')
    .description('URL для подключения к NATS')
    .asString()
    .required();

  // Пример: строка подключения к СУБД
  databaseUrl = this.param('databaseUrl')
    .fromEnv('DATABASE_URL')
    .description('Connection string для PostgreSQL')
    .asString()
    .required();

  // Пример: флаг функциональности
  useCache = this.param('useCache')
    .fromEnv('USE_CACHE')
    .description('Включить кеширование методов')
    .asBoolean()
    .default(false);

  // Пример: числовой параметр с валидацией
  cacheTtl = this.param('cacheTtl')
    .fromEnv('CACHE_TTL')
    .description('Время жизни кеша в секундах')
    .asNumber()
    .min(0)
    .max(3600)
    .default(300);
}

// ПРАВИЛО: Создавайте и экспортируйте синглтон
export const config = new ServiceConfig();
```

### Интеграция конфигурации с DI-контейнером

Конфигурация должна быть привязана к DI-контейнеру в файле `service.ts` как константа.

```typescript
// Файл: service.ts
import { Service, DependencyType, container } from '@lad-tech/nsc-toolkit';
import { connect, NatsConnection } from 'nats';
import { config } from './config.js'; // Импорт конфигурации
import { TYPES } from './inversion.types.js';

export const service = async (broker?: NatsConnection) => {
  // ПРАВИЛО: Привяжите конфиг к DI-контейнеру как CONSTANT
  container.bind(TYPES.Config, DependencyType.CONSTANT, config);

  // Использование конфигурации для подключения к NATS
  const brokerConnection = broker || (await connect({ 
    servers: [config.natsUrl] // Чтение параметра из конфига
  }));

  const serviceInstance = new Service({
    name: 'MathService',
    brokerConnection,
    methods: [Sum],
    // ... другие настройки
  });

  await serviceInstance.start();
  return serviceInstance;
};
```

### Использование конфигурации в адаптерах

Конфигурация внедряется в адаптеры (репозитории) через DI-контейнер.

```typescript
// Файл: repository/PostgresRepository/index.ts
import { inject } from '@lad-tech/nsc-toolkit';
import { TYPES } from '../../inversion.types.js';
import type { RepositoryPort } from '../../domain/ports/index.js';
import type { ServiceConfig } from '../../config.js';

export class PostgresRepository implements RepositoryPort {
  constructor(
    // ПРАВИЛО: Внедряйте конфигурацию через DI
    @inject(TYPES.Config) private config: ServiceConfig
  ) {}

  public async connect() {
    // Использование конфигурационных параметров
    const connectionString = this.config.databaseUrl;
    // ... логика подключения к БД
  }

  public async saveCalculation(data: any) {
    // Бизнес-логика с использованием конфига
    if (this.config.useCache) {
      // ... логика кеширования
    }
    // ... основная логика
  }
}
```

### Правила именования переменных окружения

- Используйте `PREFIXED_CASE` (UPPER_SNAKE_CASE)
- Добавляйте префикс имени сервиса для избежания конфликтов
- Пример: `MATH_SERVICE_DATABASE_URL`, `AUTH_SERVICE_JWT_SECRET`

### Валидация конфигурации

Библиотека `@lad-tech/config` обеспечивает валидацию параметров:

```typescript
// Пример расширенной валидации
databaseUrl = this.param('databaseUrl')
  .fromEnv('DATABASE_URL')
  .description('PostgreSQL connection string')
  .asString()
  .required()
  .match(/^postgresql:\/\//); // Валидация формата

maxConnections = this.param('maxConnections')
  .fromEnv('MAX_CONNECTIONS')
  .description('Максимальное количество соединений с БД')
  .asNumber()
  .min(1)
  .max(100)
  .default(10);
```

**Резюме для LLM:** При генерации сервиса всегда создавайте файл `config.ts` с классом, наследуемым от `Config`. Привязывайте экспортируемый синглтон к DI-контейнеру как `DependencyType.CONSTANT`. Используйте внедрение конфигурации в адаптеры через конструктор с декоратором `@inject`. 

## Структура Проекта

Следуйте этой структуре для каждого сервиса. Имена каталогов `aggregates`, `methods`, `repository`, `processing` являются стандартными.

```
services/
├── MathService/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── Calculation/
│   │   │       ├── Calculation.ts
│   │   │       ├── Calculation.interface.ts
│   │   │       └── index.ts
│   │   └── ports/
│   │       └── index.ts
│   ├── methods/
│   │   └── Sum/
│   │       ├── index.ts
│   │       └── index.test.ts
│   ├── repository/
│   │   └── PostgresRepository/
│   │       └── index.ts
│   ├── processing/           # КЛАССЫ-ОБРАБОТЧИКИ СОБЫТИЙ
│   │   └── AnotherServiceProcessing/
│   │       ├── index.ts
│   │       └── index.test.ts
│   ├── service.schema.json  # ОПИСАНИЕ СЕРВИСА
│   ├── interfaces.ts        # ТИПЫ (АВТОГЕНЕРАЦИЯ)
│   ├── inversion.types.ts   # КЛЮЧИ DI
│   ├── index.ts             # КЛИЕНТ СЕРВИСА
│   ├── service.ts           # КОНФИГУРАЦИЯ DI И СБОРКА
│   ├── start.ts             # ТОЧКА ВХОДА
│   └── package.json
```

---
**Резюме для LLM:** Для подписки на события других сервисов всегда создавайте отдельные классы-обработчики в каталоге `processing/`. Привязывайте их к DI-контейнеру как `DependencyType.ADAPTER` и запускайте в `service.ts` после создания основного сервиса. Не забывайте про подтверждение обработки (`ack()`) для событий из стримов и добавление обработчиков в `gracefulShutdown`.