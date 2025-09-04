# Configuração do Banco PostgreSQL para ONETHY

## Informações de Conexão:
- **Host**: localhost
- **Porta**: 5432 (padrão)
- **Banco de Dados**: onethy
- **Usuário**: onethy_user
- **Senha**: onethy123

## String de Conexão:
```
postgresql://onethy_user:onethy123@localhost:5432/onethy
```

## Comandos Úteis:

### Conectar ao banco:
```bash
PGPASSWORD=onethy123 psql -h localhost -U onethy_user -d onethy
```

### Verificar status do PostgreSQL:
```bash
sudo service postgresql status
```

### Iniciar PostgreSQL:
```bash
sudo service postgresql start
```

### Parar PostgreSQL:
```bash
sudo service postgresql stop
```

### Reiniciar PostgreSQL:
```bash
sudo service postgresql restart
```

## Para usar em aplicações Node.js:

### Instalar driver:
```bash
npm install pg @types/pg
```

### Exemplo de conexão:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'onethy_user',
  host: 'localhost',
  database: 'onethy',
  password: 'onethy123',
  port: 5432,
});
```

## Estrutura Inicial:
- Tabela `users` criada com campos: id, name, email, created_at
- Usuário de teste inserido: Test User (test@onethy.com)
