export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function json(data, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export function handleRouteError(err) {
  if (err instanceof HttpError) {
    return errorResponse(err.message, err.status);
  }
  console.error("API error:", err);
  return errorResponse("Serverda ichki xatolik yuz berdi", 500);
}

export function parsePositiveInt(raw, fieldName = "ID") {
  const num = Number(raw);
  if (!Number.isInteger(num) || num <= 0) {
    throw new HttpError(`${fieldName} musbat butun son bo'lishi kerak`, 400);
  }
  return num;
}

export async function readJsonBody(req) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new HttpError("So'rov tanasi JSON obyekt bo'lishi kerak", 400);
    }
    return body;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError("Noto'g'ri JSON formati yuborildi", 400);
  }
}
