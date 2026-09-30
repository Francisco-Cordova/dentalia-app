import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

/**
 * Opciones del driver que el tipo de Lucid no declara (solo lista `ssl` y
 * `connectionString`), aunque knex las reenvía tal cual a node-postgres.
 * `keepAlive` detecta sockets muertos y evita errores tras periodos idle.
 */
const supabaseConnection = {
  connectionString: env.get('SUPABASE_DB_URL'),
  ssl: { rejectUnauthorized: false },
  keepAlive: true,
  keepAliveInitialDelayMillis: 30_000,
}

const dbConfig = defineConfig({
  /**
   * Default connection used for all queries.
   */
  connection: 'sqlite',

  connections: {
    /**
     * SQLite connection (default).
     */
    sqlite: {
      client: 'better-sqlite3',

      connection: {
        /**
         * Database file location.
         */
        filename: app.tmpPath('db.sqlite3'),
      },

      /**
       * Required by Knex for SQLite defaults.
       */
      useNullAsDefault: true,

      migrations: {
        /**
         * Sort migration files naturally by filename.
         */
        naturalSort: true,

        /**
         * Paths containing migration files.
         */
        paths: ['database/migrations'],
      },
    },

    /**
     * Supabase connection (PostgreSQL).
     * Lectura del catálogo (insumos, y futuras tablas) creado en Supabase.
     *
     * - Solo lectura: `migrations` va vacío, las tablas ya existen en Supabase
     *   y NUNCA debes ejecutar `node ace migration:run --connection=supabase`.
     * - Requiere SSL (Supabase no acepta conexiones sin cifrar). El valor de
     *   SUPABASE_DB_URL se define en .env con el connection string del proyecto.
     * - `searchPath`: las tablas del catálogo se resuelven primero en el schema
     *   `dev` y, si no existen ahí, en `public`. Knex lo convierte en
     *   `set search_path to 'dev','public'` al abrir cada conexión, así que
     *   aplica a todos los modelos sin tener que declarar el schema en cada uno.
     *   Si una tabla futura vive en otro schema, quita el fallback `public` o
     *   usa `static schema` en ese modelo.
     * - Alternativa: el pooler transaccional de Supabase usa el puerto 6543.
     * - Idle: Supabase cierra las conexiones inactivas. `keepAlive` con
     *   `keepAliveInitialDelayMillis` detecta el socket muerto pronto, y el pool
     *   con `idleTimeoutMillis` bajo recicla antes de que el servidor lo corte.
     *   Aun así la primera consulta tras un corte puede fallar; por eso el
     *   controller reintenta una vez (ver app/utils/with_connection_retry.ts).
     */
    supabase: {
      client: 'pg',

      connection: supabaseConnection,

      pool: {
        min: 0,
        max: 5,
        idleTimeoutMillis: 30_000,
        acquireTimeoutMillis: 10_000,
        createTimeoutMillis: 10_000,
        propagateCreateError: true,
      },

      /**
       * Schema por defecto: `dev` primero, `public` como fallback. Lucid lo
       * pasa a knex, que ejecuta `set search_path to 'dev','public'` al abrir
       * cada conexión, así que todos los modelos resuelven contra `dev` sin
       * declarar el schema uno por uno.
       */
      searchPath: ['dev', 'public'],

      migrations: {
        naturalSort: true,
        paths: [],
      },

      debug: app.inDev,
    },

    /**
     * PostgreSQL connection.
     * Install package to switch: npm install pg
     */
    // pg: {
    //   client: 'pg',
    //   connection: {
    //     host: env.get('DB_HOST'),
    //     port: env.get('DB_PORT'),
    //     user: env.get('DB_USER'),
    //     password: env.get('DB_PASSWORD'),
    //     database: env.get('DB_DATABASE'),
    //   },
    //   migrations: {
    //     naturalSort: true,
    //     paths: ['database/migrations'],
    //   },
    //   debug: app.inDev,
    // },

    /**
     * MySQL / MariaDB connection.
     * Install package to switch: npm install mysql2
     */
    // mysql: {
    //   client: 'mysql2',
    //   connection: {
    //     host: env.get('DB_HOST'),
    //     port: env.get('DB_PORT'),
    //     user: env.get('DB_USER'),
    //     password: env.get('DB_PASSWORD'),
    //     database: env.get('DB_DATABASE'),
    //   },
    //   migrations: {
    //     naturalSort: true,
    //     paths: ['database/migrations'],
    //   },
    //   debug: app.inDev,
    // },

    /**
     * Microsoft SQL Server connection.
     * Install package to switch: npm install tedious
     */
    // mssql: {
    //   client: 'mssql',
    //   connection: {
    //     server: env.get('DB_HOST'),
    //     port: env.get('DB_PORT'),
    //     user: env.get('DB_USER'),
    //     password: env.get('DB_PASSWORD'),
    //     database: env.get('DB_DATABASE'),
    //   },
    //   migrations: {
    //     naturalSort: true,
    //     paths: ['database/migrations'],
    //   },
    //   debug: app.inDev,
    // },

    /**
     * libSQL (Turso) connection.
     * Install package to switch: npm install @libsql/client
     */
    // libsql: {
    //   client: 'libsql',
    //   connection: {
    //     url: env.get('LIBSQL_URL'),
    //     authToken: env.get('LIBSQL_AUTH_TOKEN'),
    //   },
    //   useNullAsDefault: true,
    //   migrations: {
    //     naturalSort: true,
    //     paths: ['database/migrations'],
    //   },
    //   debug: app.inDev,
    // },
  },
})

export default dbConfig
