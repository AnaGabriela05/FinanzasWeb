
# Finanzas v1.5 — Modales UI + Reportes PDF/Excel

- **Categorías personales**: cada usuario administra solo las suyas; **globales** solo admin.
- **Modales** para **Categorías**, **Métodos de pago** y **Transacciones**.
- **Mensajes** de éxito/error, y **confirmación** antes de editar/eliminar.
- **Reportes**: /reports.html — Filtros + Resumen + Descarga **PDF**/**Excel**.
- **Stack**: Node.js + Express + Sequelize + SQLite, frontend vanilla.

## Pasos de ejecución
```bash
copy .env.example .env
npm install
npm run db:sync
npm run db:seed
npm run dev
# http://localhost:3000
```

## Demo
Admin: admin@correo.com / admin123  
Usuario: demo@correo.com / 123456
