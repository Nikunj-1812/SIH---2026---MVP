from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from backend.app.config import settings
from backend.app.api.health import router as health_router
from backend.app.api.auth import router as auth_router
from backend.app.api.projects import router as projects_router
from backend.app.api.sources import router as sources_router
from backend.app.api.generation import router as generation_router
from backend.app.api.outputs import router as outputs_router
from backend.app.api.security import router as security_router
from backend.app.api.integrity import router as integrity_router
from backend.app.api.audit import router as audit_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Secure GenAI Content Transformation Platform API",
    version="1.0.0"
)

# CORS Configuration
origins = [
    "https://sih-2026-mvp.vercel.app",
    "https://sih-2026-bz427s2pv-niknujs-projects.vercel.app",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Custom HTTP Middleware for Explicit CORS Headers on All Responses & OPTIONS Preflight
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    origin = request.headers.get("origin", "*")
    if request.method == "OPTIONS":
        return JSONResponse(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            },
            content={"status": "ok"}
        )
    
    try:
        response = await call_next(request)
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            },
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": f"Server Error: {str(exc)}",
                    "path": str(request.url)
                }
            }
        )

    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": f"Server Error: {str(exc)}",
                "path": str(request.url)
            }
        }
    )

# Include API Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(sources_router)
app.include_router(generation_router)
app.include_router(outputs_router)
app.include_router(security_router)
app.include_router(integrity_router)
app.include_router(audit_router)

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=settings.DEBUG)
