import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

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
     */
    supabase: {
      client: 'pg',

      connection: {
        connectionString: env.get('SUPABASE_DB_URL'),
        ssl: { rejectUnauthorized: false },
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
