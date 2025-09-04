# 📦 ONETHY Project - Download Guide

## 🔗 Links de Download

### Download ZIP Direto
```
https://github.com/DanyelASfrod/Vs-codo/archive/refs/heads/main.zip
```

### Visualizar no GitHub
```
https://github.com/DanyelASfrod/Vs-codo
```

### Clone via Git
```bash
git clone https://github.com/DanyelASfrod/Vs-codo.git
cd Vs-codo/ONETHY
```

## 📁 Estrutura do Projeto

```
Vs-codo/
└── ONETHY/
    ├── backend/          # Node.js + Express + TypeScript + Prisma
    ├── frontend/         # Next.js 14 + React 18 + TailwindCSS
    ├── start-dev.sh      # Script para iniciar desenvolvimento
    └── DATABASE_INFO.md  # Informações do banco de dados
```

## 🚀 Quick Start

1. **Baixar o projeto:**
   - Clique no link ZIP acima OU
   - Use `git clone https://github.com/DanyelASfrod/Vs-codo.git`

2. **Navegar para a pasta:**
   ```bash
   cd Vs-codo/ONETHY
   ```

3. **Configurar banco PostgreSQL:**
   ```bash
   # Instalar PostgreSQL
   sudo apt update && sudo apt install postgresql postgresql-contrib
   
   # Criar banco
   sudo -u postgres createdb onethy
   sudo -u postgres createuser onethy_user
   ```

4. **Instalar dependências:**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend  
   cd ../frontend && npm install
   ```

5. **Iniciar desenvolvimento:**
   ```bash
   # Voltar para pasta raiz ONETHY
   cd ..
   
   # Dar permissão e executar
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

## 📋 Requisitos

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** ou **yarn**

## 🌟 Features

- 💬 **WhatsApp Integration** - Evolution API
- 📨 **Inbox Management** - Conversas centralizadas
- 🤖 **Chatbot** - Respostas automatizadas
- 👥 **Teams & Agents** - Gestão de equipes
- 📊 **Analytics** - Relatórios e métricas
- 🎨 **Modern UI** - Interface responsiva e escura

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Auth

### Frontend
- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- Responsive Design

---

**🔧 Desenvolvido por:** DanyelASfrod  
**📅 Última atualização:** September 4, 2025
