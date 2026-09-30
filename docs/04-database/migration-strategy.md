# Estrategia de migraciones

## Principios
- Toda modificación de schema se versiona.
- Evitar cambios destructivos directos.
- Definir estrategia de rollback o forward-fix.

## Proceso
1. Crear migración.
2. Probar en DEV/TEST.
3. Validar compatibilidad.
4. Aplicar según pipeline.
5. Verificar.
