# Soft Delete extension for Prisma ORM

Soft Delete extension for Prisma ORM with seamless NestJS integration.

This package provides a robust and modern solution for implementing Soft Delete in Prisma ORM within the NestJS ecosystem, leveraging the power of **Prisma Client Extensions**.

## 🚀 Main Features

- **Automatic Filtering**: All read operations (`findMany`, `findFirst`, `count`, etc.) automatically filter out deleted records by default.
- **Delete Transformation**: Calls to `delete` and `deleteMany` are intercepted and transformed into updates to the `deletedAt` field.
- **findUnique Support**: Automatically converts `findUnique` into `findFirst` when soft delete filters are applied, ensuring consistency.
- **Query Flags**: Allows querying deleted records (`_withTrashed`) or only deleted records (`_onlyTrashed`) directly in the `where` clause.
- **Base Repository**: Ready-to-use abstraction for `restore`, `forceDelete`, and specialized queries.

---

# 📦 Installation and Setup

To install the package in your project, follow the steps below.

## 📦 Installation

```bash
npm install @marcelorocfer/nest-prisma-soft-delete
```

---

## 2. Configure the Prisma Schema

For Soft Delete to work, your model **must follow some mandatory rules**:

1. Add a field with the **exact** name `deletedAt`.
2. The type must strictly be `DateTime?` (optional).
3. If your database uses `snake_case`, you must map it using `@map`, but the Prisma property name must remain `deletedAt`.

```prisma
model User {
  id        Int       @id @default(autoincrement())
  // ... other fields
  deletedAt DateTime? // REQUIRED: The field name must be exactly 'deletedAt'

  // Use this if you need snake_case in the database:
  // deletedAt DateTime? @map("deleted_at")
}
```

Run the migration after updating the schema:

```bash
npx prisma migrate dev --name add_soft_delete_to_user
```

---

## 3. Register the Extension in PrismaService

In your `PrismaService`, import and configure the extension:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from '@marcelorocfer/nest-prisma-soft-delete';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();

    return this.$extends(
      softDeleteExtension({
        models: ['User'], // Must be PascalCase, exactly as defined in Prisma schema
      }),
    ) as any;
  }

  async onModuleInit() {
    await (this as any).$connect();
  }
}
```

---

# 📄 Prisma Schema

Every model enabled for soft delete must contain the `deletedAt` field.

```prisma
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  name      String?
  deletedAt DateTime?
}
```

---

# 🛠️ Basic Usage

Once the extension is registered, Prisma queries are automatically intercepted.

## Read Operations

```typescript
// Returns only active records (deletedAt == null)
const users = await prisma.user.findMany();

// Include deleted records
const allUsers = await prisma.user.findMany({
  where: { _withTrashed: true }
});

// Only deleted records
const deletedUsers = await prisma.user.findMany({
  where: { _onlyTrashed: true }
});
```

---

## Delete Operations (Soft Delete)

```typescript
// Updates deletedAt with current timestamp
await prisma.user.delete({
  where: { id: 1 }
});

// Works with deleteMany too
await prisma.user.deleteMany({
  where: {
    email: {
      contains: '@test.com'
    }
  }
});
```

---

# 🏗️ SoftDeleteRepository

For advanced operations, extend `SoftDeleteRepository`.

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SoftDeleteRepository } from '@marcelorocfer/nest-prisma-soft-delete';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository extends SoftDeleteRepository<
  User,
  Prisma.UserWhereInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  // Available methods:
  // this.softDelete(id)
  // this.restore(id)
  // this.forceDelete(id)
  // this.findWithTrashed(where)
  // this.findOnlyTrashed(where)
}
```

---

# ⚠️ Relationship Warning

This extension **does not automatically propagate** Soft Delete to related entities (cascade behavior).

If you delete a `User`, related `Posts` will not automatically be marked as deleted.

It is recommended to handle cascade deletions at the service layer or through database triggers to ensure data integrity.

---

Designed for modern Prisma applications with minimal boilerplate and seamless NestJS integration.

# 📄 License

MIT