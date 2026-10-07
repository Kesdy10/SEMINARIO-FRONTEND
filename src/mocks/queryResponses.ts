import type { QueryResponse } from "@/types/api";

// Respuestas de ejemplo con la misma forma que POST /api/v1/query.
// Sirven para construir y probar el chat sin depender del backend.

export const mockRespuestaCodigo: QueryResponse = {
  conversation_id: "mock-conv-001",
  project_id: "mock-project",
  question: "¿Dónde se implementa el login?",
  answer:
    "\n\n" +
    "```python\ndef login_user(email: str, password: str):\n" +
    "    user = users.find_one({\"email\": email})\n" +
    "    if not user or not verify_password(password, user[\"password_hash\"]):\n" +
    "        raise HTTPException(status_code=401)\n" +
    "    return create_access_token(user[\"_id\"])\n```",
  sources: [
    {
      document: "app/services/auth_service.py",
      branch: "main",
      commit: "a1b2c3d",
      line_start: 42,
      line_end: 58,
      score: 0.91,
    },
    {
      document: "app/routers/auth.py",
      branch: "main",
      line_start: 10,
      line_end: 22,
      score: 0.74,
    },
  ],
  provider: "mock",
  model: "mock-model",
  response_time_ms: 1234.5,
};

export const mockRespuestaSQL: QueryResponse = {
  conversation_id: "mock-conv-002",
  project_id: "mock-project",
  question: "¿Qué tablas tiene la base de datos?",
  answer:
    "La base de datos tiene las tablas `usuarios`, `pedidos` y `productos`. " +
    "La tabla de pedidos se define así:\n\n" +
    "```sql\nCREATE TABLE pedidos (\n  id SERIAL PRIMARY KEY,\n" +
    "  usuario_id INT REFERENCES usuarios(id),\n  total NUMERIC(10,2),\n" +
    "  creado_en TIMESTAMP DEFAULT NOW()\n);\n```",
  sources: [
    {
      document: "database/schema.sql",
      branch: "develop",
      line_start: 1,
      line_end: 35,
      score: 0.88,
    },
  ],
  provider: "mock",
  model: "mock-model",
  response_time_ms: 980.2,
};

export const mockRespuestaTexto: QueryResponse = {
  conversation_id: "mock-conv-003",
  project_id: "mock-project",
  question: "¿Qué dice el requerimiento de recuperación de contraseña?",
  answer:
    "Según la documentación funcional, el usuario debe poder recuperar su contraseña " +
    "con un enlace enviado a su correo, válido por 30 minutos.",
  sources: [
    {
      document: "docs/requerimientos-funcionales.pdf",
      page: 12,
      score: 0.83,
    },
    {
      document: "docs/casos-de-uso.md",
      branch: "main",
      score: 0.61,
    },
  ],
  provider: "mock",
  model: "mock-model",
  response_time_ms: 1530.0,
};

export const mockRespuestas: QueryResponse[] = [
  mockRespuestaCodigo,
  mockRespuestaSQL,
  mockRespuestaTexto,
];