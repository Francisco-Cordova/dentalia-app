import { Form } from '@adonisjs/inertia/react'

export default function Login() {
  return (
    <div className="main-container-dentalia">
      <div className="tag-login-dentalia">
        <img src="/logo-dentalia.svg" alt="Dentalia" className="login-logo-dentalia" width={140} />
        <div className="center">
          <h1 className="h1-dentalia"> Bienvenido </h1>
          <p className="p-gray-13px-dentalia">Ingresa tu correo para entrar al catálogo digital</p>
          <div>
            <Form route="magic_link.send">
              {({ errors }) => (
                <>
                  <div>
                    <label htmlFor="email" className="cd_Input_Label-dentalia">
                      Correo
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="pedro@dentalia.com"
                      id="email"
                      autoComplete="username"
                      data-invalid={errors.email ? 'true' : undefined}
                    />
                    {errors.email && <div>{errors.email}</div>}
                  </div>

                  <div>
                    <button type="submit" className="button">
                      Siguiente
                    </button>
                  </div>
                </>
              )}
            </Form>
          </div>
        </div>
        <footer className="login-footer-dentalia">
          <span>Dentalia © 2026</span>
          <nav>
            <a href="#">Aviso de Privacidad</a>
            <a href="#">Términos y Condiciones</a>
          </nav>
        </footer>
      </div>

      <div className="blue-container-dentalia" />
    </div>
  )
}
