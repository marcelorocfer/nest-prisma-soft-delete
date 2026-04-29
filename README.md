# Prisma Soft Delete for NestJS

Este pacote fornece uma solução robusta e moderna para implementar Soft Delete no Prisma ORM dentro do ecossistema NestJS, utilizando o poder das **Prisma Client Extensions**.

## 🚀 Funcionalidades Principais

- **Filtro Automático**: Todas as operações de leitura (`findMany`, `findFirst`, `count`, etc.) filtram automaticamente registros deletados por padrão.
- **Transformação de Deleção**: Chamadas para `delete` e `deleteMany` são interceptadas e transformadas em atualizações do campo `deletedAt`.
- **Suporte a findUnique**: Converte automaticamente `findUnique` para `findFirst` quando filtros de soft delete são aplicados, garantindo consistência.
- **Flags de Consulta**: Permite buscar registros deletados (`_withTrashed`) ou apenas deletados (`_onlyTrashed`) diretamente na cláusula `where`.
- **Repository Base**: Abstração pronta para operações de `restore`, `forceDelete` e consultas especializadas.

## 📦 Instalação e Setup

Para instalar o pacote no seu projeto (ex: `new-modelo-soft-delete`), siga os passos abaixo:

### 1. Instalar via Git

Este pacote **não está publicado no NPM**. Para utilizá-lo, você deve instalá-lo diretamente do GitHub:

```bash
npm install https://github.com/marcelorocfer/nest-prisma-soft-delete.git
```

### 2. Configurar o Schema Prisma

Adicione o campo `deletedAt` nos modelos que deseja habilitar o Soft Delete:

```prisma
model User {
  id        Int       @id @default(autoincrement())
  // ... outros campos
  deletedAt DateTime? 
}
```

Não esqueça de rodar a migration:
```bash
npx prisma migrate dev --name add_soft_delete_to_user
```

### 3. Registrar a Extensão no PrismaService

No seu `PrismaService`, importe e configure a extensão:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from 'nest-prisma-soft-delete'; // Nome do pacote após instalação

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
    return this.$extends(
      softDeleteExtension({
        models: ['User'], // Liste os models aqui
      }),
    ) as any;
  }

  async onModuleInit() {
    await (this as any).$connect();
  }
}
```

## 📄 Schema Prisma

Todo model habilitado para soft delete deve possuir o campo `deletedAt`.

```prisma
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  name      String?
  deletedAt DateTime? // Campo obrigatório
}
```

## 🛠️ Uso Básico

Com a extensão registrada, as queries do Prisma são interceptadas automaticamente.

### Operações de Leitura

```typescript
// Retorna apenas registros ativos (deletedAt == null)
const users = await prisma.user.findMany();

// Incluir deletados na busca
const allUsers = await prisma.user.findMany({
  where: { _withTrashed: true }
});

// Apenas registros deletados
const deletedUsers = await prisma.user.findMany({
  where: { _onlyTrashed: true }
});
```

### Deletar (Soft Delete)

```typescript
// Atualiza o campo deletedAt com o timestamp atual
await prisma.user.delete({
  where: { id: 1 }
});

// O mesmo funciona para deleteMany
await prisma.user.deleteMany({
  where: { email: { contains: '@test.com' } }
});
```

## 🏗️ SoftDeleteRepository

Para operações avançadas, estenda o `SoftDeleteRepository`.

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SoftDeleteRepository } from 'nest-prisma-soft-delete';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository extends SoftDeleteRepository<User, Prisma.UserWhereInput> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  // Métodos disponíveis:
  // this.softDelete(id)
  // this.restore(id)
  // this.forceDelete(id) // Deleção física real via $executeRaw
  // this.findWithTrashed(where)
  // this.findOnlyTrashed(where)
}
```

## ⚠️ Aviso sobre Relacionamentos

A extensão **não propaga automaticamente** o Soft Delete para relações (Cascade). 

Se você deletar um `User`, os `Posts` relacionados não serão marcados como deletados automaticamente. Recomenda-se tratar deleções em cascata na camada de serviço ou via triggers no banco de dados para garantir a integridade.

---
Desenvolvido para máxima performance e compatibilidade com as versões mais recentes do Prisma.
